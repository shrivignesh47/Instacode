
import React from "react";

interface PrivacySettingsSectionProps {
  privacySettings: any;
  setPrivacySettings: (settings: any) => void;
}

const PrivacySettingsSection: React.FC<PrivacySettingsSectionProps> = ({
  privacySettings,
  setPrivacySettings,
}) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Privacy Settings</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Profile Visibility</label>
          <select
            value={privacySettings.profileVisibility}
            onChange={(e) =>
              setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })
            }
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="friends">Friends Only</option>
          </select>
        </div>
        {Object.entries(privacySettings)
          .filter(([key]) => key !== "profileVisibility")
          .map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </h4>
                <p className="text-gray-400 text-sm">
                  {key === "showEmail" && "Display your email on your profile"}
                  {key === "showLocation" && "Display your location on your profile"}
                  {key === "allowDirectMessages" && "Allow others to send you direct messages"}
                  {key === "showOnlineStatus" && "Show when you're online"}
                  {key === "dataCollection" && "Allow data collection for analytics"}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!value}
                  onChange={(e) =>
                    setPrivacySettings({
                      ...privacySettings,
                      [key]: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          ))}
      </div>
    </div>
  </div>
);

export default PrivacySettingsSection;