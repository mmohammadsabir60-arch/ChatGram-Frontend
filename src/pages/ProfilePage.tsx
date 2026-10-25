import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { Avatar } from '@/components/Avatar';
import { useToastStore } from '@/store/toastStore';
import { Moon, Sun, LogOut, Check, User, FileText, Loader2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const handleToggleTheme = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      const updated = await authApi.updateMe({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
      });
      updateUser(updated);
      addToast({
        type: 'success',
        title: 'Profile updated',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update failed',
        message: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Profile & Settings
        </h1>
      </div>

      <div className="max-w-md w-full mx-auto p-6 space-y-8">
        {/* User Card */}
        <div className="flex flex-col items-center text-center">
          <Avatar
            username={user.username}
            displayName={user.display_name}
            size="xl"
            hasRing={true}
          />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-4">
            {user.display_name || user.username}
          </h2>
          <p className="text-xs text-rose-500 font-semibold">@{user.username}</p>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1 ml-1">
              Display Name
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                placeholder="Your display name"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1 ml-1">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Bio
              </label>
              <span className="text-[10px] text-zinc-400">
                {bio.length}/150
              </span>
            </div>
            <div className="relative">
              <FileText
                size={16}
                className="absolute left-3.5 top-3 text-zinc-400"
              />
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={150}
                placeholder="Tell friends about yourself..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-zinc-900 dark:text-zinc-100 resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 px-4 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-purple-600 hover:opacity-95 text-white font-bold rounded-2xl shadow-md transition-all active:scale-[0.98] disabled:opacity-60 text-sm"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Check size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </form>

        {/* Preferences & Actions */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">
            Preferences
          </h3>

          <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl">
            <div className="flex items-center gap-3">
              {darkMode ? (
                <Moon size={18} className="text-purple-400" />
              ) : (
                <Sun size={18} className="text-amber-500" />
              )}
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Dark Mode
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                darkMode ? 'bg-purple-600' : 'bg-zinc-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 p-3 text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-2xl transition-colors text-sm"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

