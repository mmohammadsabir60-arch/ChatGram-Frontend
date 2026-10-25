import React from 'react';
import { MessageSquareDashed, UserPlus2, Users } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'chat' | 'requests' | 'friends';
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'chat',
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 max-w-sm mx-auto my-auto min-h-[300px]">
      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-100 via-rose-100 to-purple-100 dark:from-zinc-800 dark:to-zinc-800 flex items-center justify-center mb-4 text-rose-500 shadow-inner">
        {icon === 'chat' && <MessageSquareDashed size={32} strokeWidth={1.75} />}
        {icon === 'requests' && <UserPlus2 size={32} strokeWidth={1.75} />}
        {icon === 'friends' && <Users size={32} strokeWidth={1.75} />}
      </div>

      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
        {title}
      </h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
        {description}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 active:scale-95 rounded-2xl shadow-md transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

