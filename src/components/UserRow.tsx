import React from 'react';
import { UserSearchResult } from '@/types';
import { Avatar } from './Avatar';
import { usePresenceStore } from '@/store/presenceStore';
import { Check, MessageCircle, UserPlus, Clock } from 'lucide-react';
import { clsx } from 'clsx';

interface UserRowProps {
  user: UserSearchResult;
  onSendRequest?: (username: string) => void;
  onAcceptRequest?: (friendshipId: string) => void;
  onDeclineRequest?: (friendshipId: string) => void;
  onOpenChat?: (userId: string) => void;
  isActionLoading?: boolean;
}

export const UserRow: React.FC<UserRowProps> = ({
  user,
  onSendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onOpenChat,
  isActionLoading = false,
}) => {
  const isOnline = usePresenceStore((s) => s.isOnline(user.id));

  return (
    <div className="flex items-center justify-between p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 rounded-2xl transition-colors">
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <Avatar
          username={user.username}
          displayName={user.display_name}
          size="md"
          isOnline={isOnline}
          hasRing={isOnline}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
              {user.username}
            </span>
          </div>
          {user.display_name && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {user.display_name}
            </p>
          )}
          {user.bio && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate max-w-xs mt-0.5">
              {user.bio}
            </p>
          )}
        </div>
      </div>

      {/* Dynamic Relationship Actions */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {user.relationship_state === 'none' && onSendRequest && (
          <button
            onClick={() => onSendRequest(user.username)}
            disabled={isActionLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 active:scale-95 rounded-xl shadow-sm transition-all"
          >
            <UserPlus size={14} />
            <span>Add Friend</span>
          </button>
        )}

        {user.relationship_state === 'request_sent' && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            <Clock size={13} />
            <span>Requested</span>
          </span>
        )}

        {user.relationship_state === 'request_received' && user.friendship_id && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onAcceptRequest?.(user.friendship_id!)}
              disabled={isActionLoading}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-purple-600 rounded-xl hover:opacity-95 shadow-sm"
            >
              Confirm
            </button>
            <button
              onClick={() => onDeclineRequest?.(user.friendship_id!)}
              disabled={isActionLoading}
              className="px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl"
            >
              Delete
            </button>
          </div>
        )}

        {user.relationship_state === 'friends' && onOpenChat && (
          <button
            onClick={() => onOpenChat(user.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl transition-colors"
          >
            <MessageCircle size={14} />
            <span>Message</span>
          </button>
        )}

        {user.relationship_state === 'blocked' && (
          <span className="px-2.5 py-1 text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            Blocked
          </span>
        )}
      </div>
    </div>
  );
};

