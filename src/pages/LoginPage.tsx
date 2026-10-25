import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { Lock, User, AtSign, ArrowRight, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMsg('Username must be at least 3 characters long.');
      return;
    }
    if (!/^[a-z0-9._]+$/.test(cleanUsername)) {
      setErrorMsg('Username can only contain lowercase letters, numbers, periods and underscores.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    try {
      setLoading(true);
      if (isRegister) {
        await register({
          username: cleanUsername,
          password,
          display_name: displayName.trim() || undefined,
        });
        addToast({
          type: 'success',
          title: 'Account created!',
          message: `Welcome to Chatgram, @${cleanUsername}`,
        });
      } else {
        await login({
          username: cleanUsername,
          password,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-rose-50/50 via-white to-purple-50/40 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="w-full max-w-sm">
        {/* Instagram-style App Header & Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-lg shadow-rose-500/25 text-white mb-4 transform hover:scale-105 transition-transform">
            <svg
              className="w-8 h-8 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.05 21.95a1 1 0 0 0 1.25 1.25l4.782-1.388A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 0 1-4.043-1.1.996.996 0 0 0-.648-.124l-3.324.964.964-3.324a1 1 0 0 0-.124-.648A7.955 7.955 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 bg-clip-text text-transparent">
            Chatgram
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium">
            Real-time messaging with the people you care about
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-zinc-200/40 dark:shadow-none backdrop-blur-xl">
          {/* Tab Selector */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setErrorMsg(null);
              }}
              className={clsx(
                'flex-1 py-2 text-xs font-bold rounded-xl transition-all',
                !isRegister
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800'
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setErrorMsg(null);
              }}
              className={clsx(
                'flex-1 py-2 text-xs font-bold rounded-xl transition-all',
                isRegister
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800'
              )}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-medium animate-fadeIn">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5 ml-1">
                Username
              </label>
              <div className="relative">
                <AtSign
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="e.g. alex_stone"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5 ml-1">
                  Display Name <span className="text-zinc-400 font-normal">(optional)</span>
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
                    placeholder="e.g. Alex Stone"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-600 hover:via-rose-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security & Privacy note */}
        <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500 mt-6">
          End-to-end sessions protected with Argon2id and rotating keys.
        </p>
      </div>
    </div>
  );
};

