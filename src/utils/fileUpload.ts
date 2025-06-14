import { supabase } from '../lib/supabaseClient';

// File upload utilities and validation

export const validateImageFile = (file: File): string | null => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (file.size > maxSize) {
    return 'Image size must be less than 10MB';
  }

  if (!allowedTypes.includes(file.type)) {
    return 'Please select a valid image file (JPEG, PNG, GIF, WebP)';
  }

  return null;
};

export const validateVideoFile = (file: File): string | null => {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const allowedTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi'];

  if (file.size > maxSize) {
    return 'Video size must be less than 100MB';
  }

  if (!allowedTypes.includes(file.type)) {
    return 'Please select a valid video file (MP4, WebM, MOV, AVI)';
  }

  return null;
};

export const createFilePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const createVideoThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      video.currentTime = 1; // Seek to 1 second for thumbnail
    };

    video.onseeked = () => {
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnail);
      } else {
        reject(new Error('Could not create thumbnail'));
      }
    };

    video.onerror = reject;
    video.src = URL.createObjectURL(file);
  });
};

export const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      } else {
        resolve(file);
      }
    };

    img.src = URL.createObjectURL(file);
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileType = (file: File): 'image' | 'video' | 'other' => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'other';
};

// Generate unique filename with timestamp and random string
const generateFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}_${randomString}.${extension}`;
};

// Upload file to Supabase Storage with simplified path structure
export const uploadFile = async (file: File, folder: string = 'uploads'): Promise<string> => {
  try {
    // Generate unique filename
    const fileName = generateFileName(file.name);
    const filePath = `${folder}/${fileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

// Upload file with progress tracking
export const uploadFileWithProgress = async (
  file: File, 
  folder: string = 'uploads',
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Generate unique filename
    const fileName = generateFileName(file.name);
    const filePath = `${folder}/${fileName}`;

    // Simulate progress for now (Supabase doesn't provide upload progress)
    if (onProgress) {
      onProgress(10);
      await new Promise(resolve => setTimeout(resolve, 200));
      onProgress(30);
      await new Promise(resolve => setTimeout(resolve, 300));
      onProgress(60);
      await new Promise(resolve => setTimeout(resolve, 400));
      onProgress(80);
    }

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    if (onProgress) {
      onProgress(90);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    if (onProgress) {
      onProgress(100);
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

// Delete file from Supabase Storage
export const deleteFile = async (url: string): Promise<void> => {
  try {
    // Extract file path from URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const folder = urlParts[urlParts.length - 2];
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from('media')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  } catch (error) {
    console.error('File delete error:', error);
    throw error;
  }
};

// Clean up object URLs to prevent memory leaks
export const cleanupFileUrl = (url: string) => {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

// Get file info from Supabase Storage
export const getFileInfo = async (filePath: string) => {
  try {
    const { data, error } = await supabase.storage
      .from('media')
      .list(filePath.split('/')[0], {
        search: filePath.split('/')[1]
      });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Get file info error:', error);
    throw error;
  }
};