import React, { useState, useRef } from 'react';
import { Upload, X, Image, Video, File, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  acceptedTypes: string;
  maxSize: number; // in MB
  type: 'image' | 'video';
  currentFile?: File | null;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  acceptedTypes,
  maxSize,
  type,
  currentFile
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    // Check file type
    const acceptedTypesArray = acceptedTypes.split(',').map(t => t.trim());
    const isValidType = acceptedTypesArray.some(acceptedType => {
      if (acceptedType.includes('*')) {
        const baseType = acceptedType.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === acceptedType;
    });

    if (!isValidType) {
      return `Please select a valid ${type} file`;
    }

    return null;
  };

  const handleFile = (file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Create preview for images
    if (type === 'image' && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else if (type === 'video' && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    }

    onFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setPreview(null);
    setError(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = () => {
    switch (type) {
      case 'image':
        return <Image className="w-8 h-8 text-gray-400" />;
      case 'video':
        return <Video className="w-8 h-8 text-gray-400" />;
      default:
        return <File className="w-8 h-8 text-gray-400" />;
    }
  };

  const getAcceptedFormats = () => {
    switch (type) {
      case 'image':
        return 'PNG, JPG, GIF, WebP';
      case 'video':
        return 'MP4, WebM, MOV';
      default:
        return 'Various formats';
    }
  };

  if (currentFile || preview) {
    return (
      <div className="relative">
        {/* Preview */}
        <div className="border-2 border-gray-600 rounded-lg overflow-hidden">
          {type === 'image' && preview ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover"
            />
          ) : type === 'video' && preview ? (
            <video
              src={preview}
              className="w-full h-48 object-cover"
              controls
            />
          ) : (
            <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
              {getFileIcon()}
              <div className="ml-3">
                <p className="text-white font-medium">{currentFile?.name}</p>
                <p className="text-gray-400 text-sm">
                  {currentFile ? (currentFile.size / 1024 / 1024).toFixed(2) + ' MB' : ''}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Remove button */}
        <button
          onClick={removeFile}
          className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* File info */}
        <div className="mt-2 text-sm text-gray-400">
          <p>{currentFile?.name}</p>
          <p>{currentFile ? (currentFile.size / 1024 / 1024).toFixed(2) + ' MB' : ''}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          dragActive
            ? 'border-purple-500 bg-purple-500 bg-opacity-10'
            : error
            ? 'border-red-500 bg-red-500 bg-opacity-10'
            : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex flex-col items-center">
          {error ? (
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              {getFileIcon()}
            </>
          )}

          <p className="text-white mb-2 font-medium">
            {dragActive
              ? `Drop your ${type} here`
              : `Click to upload or drag and drop`}
          </p>
          
          <p className="text-gray-400 text-sm mb-2">
            {getAcceptedFormats()} up to {maxSize}MB
          </p>

          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;