/*
  # Configure Storage Bucket and RLS Policies

  1. Storage Setup
    - Create 'media' storage bucket if it doesn't exist
    - Configure bucket settings for public access
  
  2. Security Policies
    - Allow authenticated users to upload files (INSERT)
    - Allow public read access to uploaded files (SELECT)
    - Allow users to delete their own uploaded files (DELETE)
    - Allow users to update their own uploaded files (UPDATE)

  3. Important Notes
    - Files will be publicly readable but only uploadable by authenticated users
    - Users can manage (delete/update) files they uploaded
    - Bucket is configured for optimal web usage
*/

-- Create the media bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  104857600, -- 100MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/mov',
    'video/avi'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png', 
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/mov',
    'video/avi'
  ];

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Allow public read access to all files in media bucket
CREATE POLICY "Public read access for media files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media');

-- Allow users to delete files they uploaded
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update files they uploaded
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);