import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChatStore } from '@/store/chatStore';
import { usePresenceStore } from '@/store/presenceStore';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { ChatRowSkeleton } from '@/components/Skeleton';
import { ThreadPage } from './ThreadPage';
import { PlusCircle, Search } from 'lucide-react';
import { clsx } from 'clsx';

export const InboxPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: routeThreadId } = useParams<{ id?: string }>();
  const [filterText, setFilterText] = useState('');

  const {
    conversations,
    fetchConversations,
    activeConversationId,
    setActiveConversation,
    isLoadingConversations,
  } = useChatStore();

  const isUserOnline = usePresenceStore((s) => s.isOnline);
  const currentUser = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (routeThreadId && activeConversationId !== routeThreadId) {
      setActiveConversation(routeThreadId);
    }
  }, [routeThreadId, activeConversationId, setActiveConversation]);

  const filteredConversations = conversations.filter((c) => {
    const name = (c.other_user.display_name || '').toLowerCase();
    const username = c.other_user.username.toLowerCase();
    const q = filterText.toLowerCase();
    return name.includes(q) || username.includes(q);
  });

  const handleSelectConversation = (convId: string) => {
    setActiveConversation(convId);
    // On mobile (< 1024px), route to full thread view
    if (window.innerWidth < 1024) {
      navigate(`/thread/${convId}`);
    }
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-white dark:bg-zinc-950">
      {/* Left Pane: Conversation List */}
      <div
        className={clsx(
          'w-full lg:w-96 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex-shrink-0',
          routeThreadId && 'hidden lg:flex'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {currentUser?.username ? `@${currentUser.username}` : 'Messages'}
            </h1>
            <button
              onClick={() => navigate('/search')}
              className="p-1.5 text-zinc-500 hover:text-rose-500 dark:text-zinc-400 dark:hover:text-rose-400 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="New Message"
            >
              <PlusCircle size={22} />
            </button>
          </div>

          {/* Quick Filter */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-100 dark:bg-zinc-800/80 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
            />
          </div>
        </div>

        {/* Conversation List Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-900">
          {isLoadingConversations && conversations.length === 0 ? (
            <>
              <ChatRowSkeleton />
              <ChatRowSkeleton />
              <ChatRowSkeleton />
            </>
          ) : filteredConversations.length === 0 ? (
            <EmptyState
              icon="chat"
              title="No messages yet"
              description="Connect with your friends to start chatting."
              actionText="Find Friends"
              onAction={() => navigate('/search')}
            />
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = activeConversationId === conv.id;
              const isOnline = isUserOnline(conv.other_user.id);
              const hasUnread = conv.unread_count > 0;

              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={clsx(
                    'flex items-center gap-3.5 p-3.5 cursor-pointer transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900/60',
                    isSelected && 'bg-zinc-100/80 dark:bg-zinc-900 border-l-4 border-rose-500'
                  )}
                >
                  <Avatar
                    username={conv.other_user.username}
                    displayName={conv.other_user.display_name}
                    size="md"
                    isOnline={isOnline}
                    hasRing={isOnline || hasUnread}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4
                        className={clsx(
                          'text-sm truncate',
                          hasUnread
                            ? 'font-bold text-zinc-900 dark:text-zinc-100'
                            : 'font-semibold text-zinc-800 dark:text-zinc-200'
                        )}
                      >
                        {conv.other_user.display_name || conv.other_user.username}
                      </h4>
                      {conv.last_message_at && (
                        <span className="text-[11px] text-zinc-400 flex-shrink-0 ml-1">
                          {new Date(conv.last_message_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p
                        className={clsx(
                          'text-xs truncate pr-2',
                          hasUnread
                            ? 'font-bold text-zinc-900 dark:text-zinc-100'
                            : 'text-zinc-500 dark:text-zinc-400'
                        )}
                      >
                        {conv.last_message?.body || 'Sent an attachment'}
                      </p>
                      {hasUnread && (
                        <span className="flex-shrink-0 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane (Desktop ≥ 1024px): Active Chat Thread */}
      <div className="hidden lg:flex flex-1 flex-col h-full bg-zinc-50 dark:bg-zinc-950">
        {activeConversationId ? (
          <ThreadPage embeddedConversationId={activeConversationId} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400 mb-4">
              <svg className="w-10 h-10 stroke-current" fill="none" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
              Your Messages
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mt-1">
              Send private messages and real-time replies to your friends.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

