
import React from "react";

interface DataSettingsSectionProps {}

const DataSettingsSection: React.FC<DataSettingsSectionProps> = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Data Management</h3>
      <div className="space-y-4">
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-white font-medium mb-2">Export Data</h4>
          <p className="text-gray-400 text-sm mb-4">Download a copy of your data</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            Request Export
          </button>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-white font-medium mb-2">Delete Account</h4>
          <p className="text-gray-400 text-sm mb-4">Permanently delete your account and all data</p>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default DataSettingsSection;