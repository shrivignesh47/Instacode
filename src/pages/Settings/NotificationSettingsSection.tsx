
import React from "react";

interface NotificationSettingsSectionProps {
  notificationSettings: any;
  setNotificationSettings: (settings: any) => void;
}

const NotificationSettingsSection: React.FC<NotificationSettingsSectionProps> = ({
  notificationSettings,
  setNotificationSettings,
}) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Notification Preferences</h3>
      <div className="space-y-4">
        {Object.entries(notificationSettings).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </h4>
              <p className="text-gray-400 text-sm">
                {key === "emailNotifications" && "Receive notifications via email"}
                {key === "pushNotifications" && "Receive push notifications in browser"}
                {key === "postLikes" && "When someone likes your post"}
                {key === "postComments" && "When someone comments on your post"}
                {key === "newFollowers" && "When someone follows you"}
                {key === "mentions" && "When someone mentions you"}
                {key === "weeklyDigest" && "Weekly summary of your activity"}
                {key === "productUpdates" && "Updates about new features"}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
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

export default NotificationSettingsSection;