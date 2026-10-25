import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { friendsApi } from '@/api/friends';
import { chatApi } from '@/api/chat';
import { FriendItem } from '@/types';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { usePresenceStore } from '@/store/presenceStore';
import { useChatStore } from '@/store/chatStore';
import { useToastStore } from '@/store/toastStore';
import { MessageCircle, MoreVertical, Trash2, ShieldAlert, Loader2 } from 'lucide-react';

export const FriendsPage: React.FC = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const isUserOnline = usePresenceStore((s) => s.isOnline);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const addToast = useToastStore((s) => s.addToast);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const items = await friendsApi.listFriends();
      setFriends(items);
    } catch (err: any) {
      console.error('Failed to load friends', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  const handleOpenChat = async (userId: string) => {
    try {
      const conv = await chatApi.createConversation(userId);
      setActiveConversation(conv.id);
      navigate(`/thread/${conv.id}`);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Could not open chat',
        message: err.message,
      });
    }
  };

  const handleRemoveFriend = async (userId: string, username: string) => {
    try {
      await friendsApi.removeFriend(userId);
      setFriends((prev) => prev.filter((f) => f.user.id !== userId));
      setActiveMenuId(null);
      addToast({
        type: 'info',
        title: 'Friend removed',
        message: `Removed @${username} from your friends`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const handleBlockUser = async (userId: string, username: string) => {
    try {
      await friendsApi.blockUser(userId);
      setFriends((prev) => prev.filter((f) => f.user.id !== userId));
      setActiveMenuId(null);
      addToast({
        type: 'info',
        title: 'User blocked',
        message: `@${username} has been blocked`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Friends
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
          </p>
        </div>

        <button
          onClick={() => navigate('/search')}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100"
        >
          Find More
        </button>
      </div>

      {/* Friends list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="animate-spin text-rose-500" size={24} />
          </div>
        ) : friends.length === 0 ? (
          <EmptyState
            icon="friends"
            title="No friends yet"
            description="Find people you know on Chatgram and send them a friend request."
            actionText="Find Friends"
            onAction={() => navigate('/search')}
          />
        ) : (
          friends.map(({ friendship_id, user }) => {
            const isOnline = isUserOnline(user.id);

            return (
              <div
                key={friendship_id}
                className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <Avatar
                    username={user.username}
                    displayName={user.display_name}
                    size="md"
                    isOnline={isOnline}
                    hasRing={isOnline}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {user.display_name || user.username}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">
                      @{user.username}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 relative">
                  <button
                    onClick={() => handleOpenChat(user.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-purple-600 rounded-xl shadow-sm hover:opacity-95"
                  >
                    <MessageCircle size={14} />
                    <span>Message</span>
                  </button>

                  <button
                    onClick={() =>
                      setActiveMenuId(activeMenuId === user.id ? null : user.id)
                    }
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenuId === user.id && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-20">
                      <button
                        onClick={() => handleRemoveFriend(user.id, user.username)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      >
                        <Trash2 size={13} />
                        <span>Unfriend</span>
                      </button>
                      <button
                        onClick={() => handleBlockUser(user.id, user.username)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      >
                        <ShieldAlert size={13} />
                        <span>Block User</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

