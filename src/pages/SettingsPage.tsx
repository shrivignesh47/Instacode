import { useState, useEffect } from 'react';
import {
  User, 
  Bell, 
  Shield, 
  Palette, 
  Database, 
  Key, 
  Github, 
  Linkedin, 
  Twitter, 
  Code, 
  Award, 
  Save,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import ProfileSettingsSection from "./Settings/ProfileSettingsSection";
import AccountSettingsSection from "./Settings/AccountSettingsSection";
import NotificationSettingsSection from "./Settings/NotificationSettingsSection";
import PrivacySettingsSection from "./Settings/PrivacySettingsSection";
import AppearanceSettingsSection from "./Settings/AppearanceSettingsSection";
import DataSettingsSection from "./Settings/DataSettingsSection";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { user, updateProfile } = useAuth();

  // Fetch profile from database
  const [profileData, setProfileData] = useState({
    displayName: '',
    username: '',
    email: '',
    bio: '',
    location: '',
    website: '',
    githubUrl: '',
    linkedinUrl: '',
    twitterUrl: '',
    leetcodeUsername: '',
    hackerrankUrl: '',
    codeforceUrl: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    receiveFollowNotifications: true,
    receiveMessageNotifications: true,
    receivePostLikeNotifications: true,
    receivePostCommentNotifications: true,
    receiveNewPostFromFollowedNotifications: true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showLocation: true,
    allowDirectMessages: true,
    showOnlineStatus: true,
    dataCollection: true,
  });

  // Fetch user's profile info on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      // Get profile from table
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setProfileData({
          displayName: profile.display_name || '',
          username: profile.username || '',
          email: profile.email || '',
          bio: profile.bio || '',
          location: profile.location || '',
          website: profile.website || '',
          githubUrl: profile.github_url || '',
          linkedinUrl: profile.linkedin_url || '',
          twitterUrl: profile.twitter_url || '',
          leetcodeUsername: profile.leetcode_username || '',
          hackerrankUrl: '',
          codeforceUrl: '',
        });
        
        setNotificationSettings({
          receiveFollowNotifications: profile.receive_follow_notifications ?? true,
          receiveMessageNotifications: profile.receive_message_notifications ?? true,
          receivePostLikeNotifications: profile.receive_post_like_notifications ?? true,
          receivePostCommentNotifications: profile.receive_post_comment_notifications ?? true,
          receiveNewPostFromFollowedNotifications: profile.receive_new_post_from_followed_notifications ?? true,
        });
      }
    };
    fetchProfile();
  }, [user]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data & Storage', icon: Database },
  ];

  const codingPlatforms = [
    { 
      name: 'GitHub', 
      icon: Github, 
      key: 'githubUrl', 
      placeholder: 'https://github.com/username',
      color: 'text-gray-400 hover:text-white'
    },
    { 
      name: 'HackerRank', 
      icon: Award, 
      key: 'hackerrankUrl', 
      placeholder: 'https://hackerrank.com/username',
      color: 'text-green-400 hover:text-green-300'
    },
    { 
      name: 'Codeforces', 
      icon: Code, 
      key: 'codeforceUrl', 
      placeholder: 'https://codeforces.com/profile/username',
      color: 'text-blue-400 hover:text-blue-300'
    },
    { 
      name: 'LinkedIn', 
      icon: Linkedin, 
      key: 'linkedinUrl', 
      placeholder: 'https://linkedin.com/in/username',
      color: 'text-blue-400 hover:text-blue-300'
    },
    { 
      name: 'Twitter', 
      icon: Twitter, 
      key: 'twitterUrl', 
      placeholder: 'https://twitter.com/username',
      color: 'text-blue-400 hover:text-blue-300'
    },
  ];

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      // Update profile data
      await updateProfile({
        displayName: profileData.displayName,
        username: profileData.username,
        email: profileData.email,
        bio: profileData.bio,
        location: profileData.location,
        website: profileData.website,
        githubUrl: profileData.githubUrl,
        linkedinUrl: profileData.linkedinUrl,
        twitterUrl: profileData.twitterUrl,
        leetcodeUsername: profileData.leetcodeUsername,
      });

      // Update notification settings
      const { error: notificationUpdateError } = await supabase
        .from('profiles')
        .update({
          receive_follow_notifications: notificationSettings.receiveFollowNotifications,
          receive_message_notifications: notificationSettings.receiveMessageNotifications,
          receive_post_like_notifications: notificationSettings.receivePostLikeNotifications,
          receive_post_comment_notifications: notificationSettings.receivePostCommentNotifications,
          receive_new_post_from_followed_notifications: notificationSettings.receiveNewPostFromFollowedNotifications,
        })
        .eq('id', user.id);

      if (notificationUpdateError) {
        throw notificationUpdateError;
      }

      setSaveSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setSaveError(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Replace section render functions with subcomponents
  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <ProfileSettingsSection
            profileData={profileData}
            setProfileData={setProfileData}
            codingPlatforms={codingPlatforms}
          />
        );
      case "account":
        return (
          <AccountSettingsSection
            profileData={profileData}
            setProfileData={setProfileData}
            passwordData={passwordData}
            setPasswordData={setPasswordData}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showNewPassword={showNewPassword}
            setShowNewPassword={setShowNewPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
          />
        );
      case "notifications":
        return (
          <NotificationSettingsSection
            notificationSettings={notificationSettings}
            setNotificationSettings={setNotificationSettings}
          />
        );
      case "privacy":
        return (
          <PrivacySettingsSection
            privacySettings={privacySettings}
            setPrivacySettings={setPrivacySettings}
          />
        );
      case "appearance":
        return <AppearanceSettingsSection />;
      case "data":
        return <DataSettingsSection />;
      default:
        return (
          <ProfileSettingsSection
            profileData={profileData}
            setProfileData={setProfileData}
            codingPlatforms={codingPlatforms}
          />
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          Settings
        </h1>
        <p className="text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                      activeTab === tab.id
                        ? "bg-purple-600 text-white"
                        : "text-gray-300 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 lg:p-6">
            {renderTabContent()}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              {saveSuccess && (
                <div className="mb-4 p-3 bg-green-900 bg-opacity-50 border border-green-600 rounded-lg text-green-200 text-sm">
                  Settings saved successfully!
                </div>
              )}
              
              {saveError && (
                <div className="mb-4 p-3 bg-red-900 bg-opacity-50 border border-red-600 rounded-lg text-red-200 text-sm">
                  Error: {saveError}
                </div>
              )}
              
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;