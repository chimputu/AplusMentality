'use client';

import { useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import {
  User,
  Bell,
  Palette,
  Moon,
  Sun,
  Monitor,
  Save,
  Loader2,
  CheckCircle,
  Shield,
  LogOut,
  Key,
  Link2,
  Copy,
  Check,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateInstitutionSlug, updateUniversityJoinSlug } from '@/lib/actions/institution-crud';

interface AdminSettingsClientProps {
  institutionSlug?: string;
  institutionId?: string;
  universityJoinSlug?: string;
  universityId?: string;
}

export default function AdminSettingsClient({ institutionSlug, institutionId, universityJoinSlug, universityId }: AdminSettingsClientProps) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const { theme, setTheme, systemTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [slugLoading, setSlugLoading] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [slugSuccess, setSlugSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  const [editSlug, setEditSlug] = useState(institutionSlug || universityJoinSlug || '');

  const [settings, setSettings] = useState({
    name: user?.fullName || user?.firstName || '',
    email: user?.emailAddresses?.[0]?.emailAddress || '',
    emailNotifications: true,
    pushNotifications: false,
    twoFactorAuth: false,
    sessionTimeout: '30',
  });

  const joinSlug = institutionSlug || universityJoinSlug || null;
  const joinLink = joinSlug ? `${window.location.origin}/join/${joinSlug}` : null;

  const handleCopyLink = async () => {
    if (!joinLink) return;
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = joinLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveSlug = async () => {
    setSlugError('');
    setSlugSuccess('');
    setSlugLoading(true);
    try {
      if (institutionId) {
        await updateInstitutionSlug(institutionId, editSlug);
      } else if (universityId) {
        await updateUniversityJoinSlug(universityId, editSlug);
      }
      setSlugSuccess('Join slug updated successfully!');
      router.refresh();
      setTimeout(() => setSlugSuccess(''), 3000);
    } catch (err: any) {
      setSlugError(err.message || 'Failed to update slug');
      setTimeout(() => setSlugError(''), 5000);
    } finally {
      setSlugLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: settings.name }),
      });

      if (!res.ok) throw new Error('Failed to update profile');

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    try {
      await fetch('/api/users/me/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      });
    } catch (err) {
      console.error('Failed to save theme:', err);
    }
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to sign out?')) return;

    try {
      await signOut();
      router.push('/sign-in');
    } catch (error) {
      console.error('Sign out failed:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  if (theme === undefined) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Admin Settings
        </h1>
        <p className="text-gray-600 dark:text-muted-foreground text-sm">
          Manage your account and application settings
        </p>
      </div>

      {saved && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Settings saved successfully!
        </div>
      )}

      {/* Profile Section */}
      <section className="bg-card rounded-xl shadow-sm border border-gray-100 dark:border-border p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-foreground mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-500" />
          Profile
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) =>
                setSettings({ ...settings, name: e.target.value })
              }
              className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-2 bg-white dark:bg-muted text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
              Email
            </label>
            <input
              type="email"
              value={settings.email}
              disabled
              className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-2 bg-gray-50 dark:bg-muted text-muted-foreground cursor-not-allowed text-base"
            />
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-card rounded-xl shadow-sm border border-gray-100 dark:border-border p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-foreground mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-500" />
          Notifications
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-foreground">
                Email Notifications
              </p>
              <p className="text-xs text-muted-foreground">
                Receive email updates
              </p>
            </div>
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  emailNotifications: !settings.emailNotifications,
                })
              }
              className={`relative w-11 h-6 rounded-full transition ${
                settings.emailNotifications
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-muted'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${
                  settings.emailNotifications ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-border">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-foreground">
                Push Notifications
              </p>
              <p className="text-xs text-muted-foreground">
                Browser notifications
              </p>
            </div>
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  pushNotifications: !settings.pushNotifications,
                })
              }
              className={`relative w-11 h-6 rounded-full transition ${
                settings.pushNotifications
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-muted'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${
                  settings.pushNotifications ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="bg-card rounded-xl shadow-sm border border-gray-100 dark:border-border p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-foreground mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-blue-500" />
          Appearance
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => handleThemeChange('light')}
            className={`p-4 rounded-xl border-2 transition ${
              theme === 'light'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-border hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <Sun className="w-8 h-8 mx-auto text-yellow-500" />
            <p className="text-sm font-medium text-gray-700 dark:text-foreground mt-2">
              Light
            </p>
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`p-4 rounded-xl border-2 transition ${
              theme === 'dark'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-border hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <Moon className="w-8 h-8 mx-auto text-gray-700 dark:text-foreground" />
            <p className="text-sm font-medium text-gray-700 dark:text-foreground mt-2">
              Dark
            </p>
          </button>
          <button
            onClick={() => handleThemeChange('system')}
            className={`p-4 rounded-xl border-2 transition ${
              theme === 'system'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-border hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <Monitor className="w-8 h-8 mx-auto text-gray-500" />
            <p className="text-sm font-medium text-gray-700 dark:text-foreground mt-2">
              System
            </p>
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Current:{' '}
          {theme === 'system'
            ? `${isDark ? 'Dark' : 'Light'} (System)`
            : theme}
        </p>
      </section>

      {/* Security */}
      <section className="bg-card rounded-xl shadow-sm border border-gray-100 dark:border-border p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-foreground mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          Security
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-foreground">
                Two-Factor Authentication
              </p>
              <p className="text-xs text-muted-foreground">
                Add an extra layer of security
              </p>
            </div>
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  twoFactorAuth: !settings.twoFactorAuth,
                })
              }
              className={`relative w-11 h-6 rounded-full transition ${
                settings.twoFactorAuth
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-muted'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${
                  settings.twoFactorAuth ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-border">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-foreground">
                Session Timeout
              </p>
              <p className="text-xs text-muted-foreground">
                Auto logout after inactivity
              </p>
            </div>
            <select
              value={settings.sessionTimeout}
              onChange={(e) =>
                setSettings({ ...settings, sessionTimeout: e.target.value })
              }
              className="border border-gray-300 dark:border-border rounded-lg px-3 py-1.5 bg-white dark:bg-muted text-foreground text-base"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
            </select>
          </div>
        </div>
      </section>

      {/* Join Link */}
      <section className="bg-card rounded-xl shadow-sm border border-gray-100 dark:border-border p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-foreground mb-4 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-blue-500" />
          Join Link
        </h2>
        <p className="text-sm text-gray-600 dark:text-muted-foreground mb-4">
          Share this link with students so they can join your institution directly.
        </p>

        {joinLink ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={joinLink}
                readOnly
                className="flex-1 border border-gray-300 dark:border-border rounded-lg px-3 py-2 bg-gray-50 dark:bg-muted text-gray-600 dark:text-muted-foreground text-sm font-mono"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition min-h-[44px] text-sm font-medium shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1.5">
                Edit Join Slug
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">/join/</span>
                <input
                  type="text"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value.toLowerCase())}
                  className="flex-1 border border-gray-300 dark:border-border rounded-lg px-3 py-2 bg-white dark:bg-muted text-foreground text-sm font-mono text-base"
                  placeholder="unza-2024"
                />
                <button
                  onClick={handleSaveSlug}
                  disabled={slugLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition min-h-[44px] text-sm font-medium disabled:opacity-50 shrink-0"
                >
                  {slugLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
              {slugError && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{slugError}</p>
              )}
              {slugSuccess && (
                <p className="mt-1.5 text-sm text-green-600 dark:text-green-400">{slugSuccess}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              No join slug configured yet. Contact the Super Admin to set up your institution&apos;s join link.
            </p>
          </div>
        )}
      </section>

      {/* Account */}
      <section className="bg-card rounded-xl shadow-sm border border-gray-100 dark:border-border p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-foreground mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-500" />
          Account
        </h2>
        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 px-4 py-3 rounded-lg transition font-medium min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        {saved && (
          <span className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            Settings saved!
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={loading}
          className="ml-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 font-medium min-h-[44px]"
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
