'use client';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Palette,
  Moon,
  Sun,
  Monitor,
  Save,
  Loader2,
  Mail,
  Lock,
  Key,
  Database,
  Cloud,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    // Profile
    name: user?.fullName || '',
    email: user?.emailAddresses?.[0]?.emailAddress || '',
    
    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    announcementAlerts: true,
    
    // Appearance
    theme: 'system', // 'light' | 'dark' | 'system'
    
    // Security
    twoFactorAuth: false,
    sessionTimeout: '30',
  });

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Manage your account and application settings</p>
      </div>

      {/* Profile Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-500" />
          Profile
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-500" />
          Notifications
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receive email updates about announcements</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
              className={`relative w-11 h-6 rounded-full transition ${
                settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${
                settings.emailNotifications ? 'translate-x-5' : ''
              }`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Push Notifications</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receive push notifications in browser</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, pushNotifications: !settings.pushNotifications })}
              className={`relative w-11 h-6 rounded-full transition ${
                settings.pushNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${
                settings.pushNotifications ? 'translate-x-5' : ''
              }`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Announcement Alerts</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Get notified about new announcements</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, announcementAlerts: !settings.announcementAlerts })}
              className={`relative w-11 h-6 rounded-full transition ${
                settings.announcementAlerts ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${
                settings.announcementAlerts ? 'translate-x-5' : ''
              }`} />
            </button>
          </div>
        </div>
      </section>

      {/* Appearance Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-blue-500" />
          Appearance
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setSettings({ ...settings, theme: 'light' })}
            className={`p-4 rounded-xl border-2 transition ${
              settings.theme === 'light'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <Sun className="w-8 h-8 mx-auto text-yellow-500" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">Light</p>
          </button>
          <button
            onClick={() => setSettings({ ...settings, theme: 'dark' })}
            className={`p-4 rounded-xl border-2 transition ${
              settings.theme === 'dark'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <Moon className="w-8 h-8 mx-auto text-gray-700 dark:text-gray-300" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">Dark</p>
          </button>
          <button
            onClick={() => setSettings({ ...settings, theme: 'system' })}
            className={`p-4 rounded-xl border-2 transition ${
              settings.theme === 'system'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <Monitor className="w-8 h-8 mx-auto text-gray-500" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">System</p>
          </button>
        </div>
      </section>

      {/* Security Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          Security
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Two-Factor Authentication</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, twoFactorAuth: !settings.twoFactorAuth })}
              className={`relative w-11 h-6 rounded-full transition ${
                settings.twoFactorAuth ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${
                settings.twoFactorAuth ? 'translate-x-5' : ''
              }`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Session Timeout</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Automatically log out after inactivity</p>
            </div>
            <select
              value={settings.sessionTimeout}
              onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
            </select>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        {saved && (
          <span className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            Settings saved successfully!
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={loading}
          className="ml-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}