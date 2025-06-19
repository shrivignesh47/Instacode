import React from "react";
import { Code } from 'lucide-react';

interface CodingPlatform {
  name: string;
  icon: any;
  key: string;
  placeholder: string;
  color: string;
}

interface ProfileSettingsSectionProps {
  profileData: any;
  setProfileData: (data: any) => void;
  codingPlatforms: CodingPlatform[];
}

const ProfileSettingsSection: React.FC<ProfileSettingsSectionProps> = ({
  profileData,
  setProfileData,
  codingPlatforms,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
            <input
              type="text"
              value={profileData.displayName}
              onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <input
              type="text"
              value={profileData.username}
              onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
            <textarea
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
            <input
              type="text"
              value={profileData.location}
              onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
            <input
              type="url"
              value={profileData.website}
              onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Coding Platform Links</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LeetCode Username Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
              <Code className="w-4 h-4 mr-2 text-yellow-400" />
              LeetCode Username
            </label>
            <input
              type="text"
              value={profileData.leetcodeUsername || ''}
              onChange={(e) => setProfileData({ ...profileData, leetcodeUsername: e.target.value })}
              placeholder="Enter your LeetCode username"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          {codingPlatforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <div key={platform.key}>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                  <Icon className={`w-4 h-4 mr-2 ${platform.color}`} />
                  {platform.name}
                </label>
                <input
                  type="url"
                  value={profileData[platform.key as keyof typeof profileData]}
                  onChange={(e) => setProfileData({ ...profileData, [platform.key]: e.target.value })}
                  placeholder={platform.placeholder}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsSection;