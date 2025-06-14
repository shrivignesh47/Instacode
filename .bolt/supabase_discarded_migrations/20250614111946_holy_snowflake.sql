/*
  # Fix Storage RLS Policies for File Uploads

  1. Storage Bucket Policies
    - Enable RLS on storage.objects table
    - Add policy for authenticated users to upload files to media bucket
    - Add policy for public read access to media files
    - Add policy for users to delete their own uploaded files

  2. Security
    - Ensure authenticated users can upload to media bucket
    - Allow public read access for media files
    - Allow users to manage their own uploaded files
*/

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload media files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media files" ON storage.objects;

-- Policy for authenticated users to upload files to the media bucket
CREATE POLICY "Authenticated users can upload media files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Policy for public read access to media files
CREATE POLICY "Public can view media files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media');

-- Policy for users to delete their own uploaded files
CREATE POLICY "Users can delete their own media files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = owner);

-- Ensure the media bucket exists and is public for reads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  104857600, -- 100MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/mov', 'video/avi']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/mov', 'video/avi'];