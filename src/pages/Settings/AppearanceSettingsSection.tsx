
import React from "react";

interface AppearanceSettingsSectionProps {}

const AppearanceSettingsSection: React.FC<AppearanceSettingsSectionProps> = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Theme</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {["Dark", "Light", "Auto"].map((theme) => (
          <div
            key={theme}
            className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors border-2 border-purple-600"
          >
            <div className="text-center">
              <div
                className={`w-12 h-8 mx-auto mb-2 rounded ${
                  theme === "Dark"
                    ? "bg-gray-900"
                    : theme === "Light"
                    ? "bg-white"
                    : "bg-gradient-to-r from-gray-900 to-white"
                }`}
              ></div>
              <span className="text-white font-medium">{theme}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Language</h3>
      <select className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
        <option value="ja">Japanese</option>
      </select>
    </div>
  </div>
);

export default AppearanceSettingsSection;