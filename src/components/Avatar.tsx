import React from 'react';
import { clsx } from 'clsx';

interface AvatarProps {
  username: string;
  displayName?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  hasRing?: boolean;
  className?: string;
}

// Generate consistent gradient pairs based on username hash
const GRADIENTS = [
  'from-pink-500 to-rose-500',
  'from-purple-600 to-indigo-600',
  'from-amber-500 to-orange-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-fuchsia-600 to-pink-600',
];

const getGradient = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
};

export const Avatar: React.FC<AvatarProps> = ({
  username,
  displayName,
  size = 'md',
  isOnline = false,
  hasRing = false,
  className,
}) => {
  const name = displayName || username || 'User';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const sizeClasses = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-xl',
  };

  const ringPad = {
    xs: 'p-[1.5px]',
    sm: 'p-[2px]',
    md: 'p-[2.5px]',
    lg: 'p-[3px]',
    xl: 'p-[3.5px]',
  };

  const avatarContent = (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-tr shadow-sm select-none',
        sizeClasses[size],
        getGradient(username),
        className
      )}
    >
      {initials}
    </div>
  );

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0">
      {hasRing ? (
        <div
          className={clsx(
            'rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600',
            ringPad[size]
          )}
        >
          <div className="rounded-full bg-white dark:bg-zinc-950 p-[2px]">
            {avatarContent}
          </div>
        </div>
      ) : (
        avatarContent
      )}

      {isOnline && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-zinc-950 bg-emerald-500',
            size === 'xs' || size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'
          )}
          title="Online"
        />
      )}
    </div>
  );
};

