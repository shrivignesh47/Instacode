import { useState } from 'react';
import { Loader2, Trash2, Code } from 'lucide-react';
import FileUpload from './FileUpload';
import { uploadFile, validateImageFile } from '../utils/fileUpload';

interface EditProfileModalProps {
  isOpen: boolean;
  profileData: {
    display_name: string;
    bio: string;
    location: string;
    website: string;
    github_url: string;
    linkedin_url: string;
    twitter_url: string;
    leetcode_username?: string;
    avatar_url?: string;
  };
  isSaving: boolean;
  saveError: string | null;
  onClose: () => void;
  onSave: (data: any) => void;
  onInputChange: (field: string, value: string) => void;
}

const EditProfileModal = ({
  isOpen,
  profileData,
  isSaving,
  saveError,
  onClose,
  onSave,
  onInputChange
}: EditProfileModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteAvatar, setDeleteAvatar] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setUploadError(null);
    setDeleteAvatar(false); // Reset delete flag when new file is selected
  };

  const handleDeleteAvatar = () => {
    setDeleteAvatar(true);
    setSelectedFile(null);
    setUploadError(null);
  };

  const handleSave = async () => {
    try {
      let avatarUrl = profileData.avatar_url;

      // If user wants to delete avatar, set to undefined
      if (deleteAvatar) {
        avatarUrl = undefined;
      }
      // Upload new profile picture if selected
      else if (selectedFile) {
        setUploadingImage(true);
        setUploadError(null);

        const validationError = validateImageFile(selectedFile);
        if (validationError) {
          setUploadError(validationError);
          setUploadingImage(false);
          return;
        }

        try {
          avatarUrl = await uploadFile(selectedFile, 'avatars');
        } catch (error: any) {
          setUploadError(error.message || 'Failed to upload image');
          setUploadingImage(false);
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      // Call the original onSave with updated data including avatar
      onSave({
        ...profileData,
        avatar_url: avatarUrl
      });
    } catch (error: any) {
      setUploadError(error.message || 'Failed to save profile');
    }
  };

  const getAvatarSrc = () => {
    if (deleteAvatar) {
      return `https://api.dicebear.com/7.x/personas/svg?seed=${profileData.display_name || 'user'}`;
    }
    return profileData.avatar_url || `https://api.dicebear.com/7.x/personas/svg?seed=${profileData.display_name || 'user'}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-6">Edit Profile</h3>
        
        <div className="space-y-4">
          {/* Profile Picture Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Profile Picture
            </label>
            <div className="flex items-start gap-4">
              {/* Current Avatar Preview */}
              <div className="flex-shrink-0 relative">
                <img
                  src={getAvatarSrc()}
                  alt="Current profile"
                  className="w-20 h-20 rounded-full border-2 border-gray-600"
                />
                {profileData.avatar_url && !deleteAvatar && (
                  <button
                    onClick={handleDeleteAvatar}
                    className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors"
                    title="Delete profile picture"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              {/* File Upload */}
              <div className="flex-1">
                {!deleteAvatar && (
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    acceptedTypes="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    maxSize={10}
                    type="image"
                    currentFile={selectedFile}
                  />
                )}
                {deleteAvatar && (
                  <div className="text-sm text-gray-400 p-4 bg-gray-700 rounded-lg">
                    Profile picture will be removed and reset to default avatar.
                    <button
                      onClick={() => setDeleteAvatar(false)}
                      className="block mt-2 text-purple-400 hover:text-purple-300 underline"
                    >
                      Cancel deletion
                    </button>
                  </div>
                )}
              </div>
            </div>
            {uploadError && (
              <p className="text-red-400 text-sm mt-2">{uploadError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={profileData.display_name}
              onChange={(e) => onInputChange('display_name', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Your display name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              value={profileData.bio}
              onChange={(e) => onInputChange('bio', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={profileData.location}
              onChange={(e) => onInputChange('location', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Where are you based?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Website
            </label>
            <input
              type="url"
              value={profileData.website}
              onChange={(e) => onInputChange('website', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              GitHub URL
            </label>
            <input
              type="url"
              value={profileData.github_url}
              onChange={(e) => onInputChange('github_url', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="https://github.com/yourusername"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              LinkedIn URL
            </label>
            <input
              type="url"
              value={profileData.linkedin_url}
              onChange={(e) => onInputChange('linkedin_url', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="https://linkedin.com/in/yourusername"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Twitter URL
            </label>
            <input
              type="url"
              value={profileData.twitter_url}
              onChange={(e) => onInputChange('twitter_url', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="https://twitter.com/yourusername"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
              <Code className="w-4 h-4 mr-2 text-yellow-400" />
              LeetCode Username
            </label>
            <input
              type="text"
              value={profileData.leetcode_username || ''}
              onChange={(e) => onInputChange('leetcode_username', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Your LeetCode username"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter your LeetCode username to display your coding stats and submissions on your profile
            </p>
          </div>
        </div>

        {saveError && (
          <div className="text-red-500 text-sm mt-4" role="alert">
            {saveError}
          </div>
        )}

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || uploadingImage}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center"
          >
            {isSaving || uploadingImage ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {uploadingImage ? 'Uploading...' : 'Saving...'}
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;