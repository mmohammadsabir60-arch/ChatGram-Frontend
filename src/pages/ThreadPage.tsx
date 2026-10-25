import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore } from '@/store/chatStore';
import { usePresenceStore } from '@/store/presenceStore';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/Avatar';
import { Bubble } from '@/components/Bubble';
import { NewMessagePill } from '@/components/NewMessagePill';
import { MessagesSkeleton } from '@/components/Skeleton';
import { socketService } from '@/ws/socket';
import { ArrowLeft, Send, Smile } from 'lucide-react';
import { clsx } from 'clsx';

export const ThreadPage: React.FC<{ embeddedConversationId?: string }> = ({
  embeddedConversationId,
}) => {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const conversationId = embeddedConversationId || paramId;

  const [inputBody, setInputBody] = useState('');
  const [showScrollPill, setShowScrollPill] = useState(false);
  const typingTimerRef = useRef<any>(null);

  const {
    conversations,
    messages,
    activeConversationId,
    setActiveConversation,
    loadOlderMessages,
    sendMessageOptimistic,
    typingUsers,
    hasMore,
    isLoadingMessages,
  } = useChatStore();

  const isUserOnline = usePresenceStore((s) => s.isOnline);
  const currentUser = useAuthStore((s) => s.user);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (conversationId && activeConversationId !== conversationId) {
      setActiveConversation(conversationId);
    }
  }, [conversationId, activeConversationId, setActiveConversation]);

  const conversation = conversations.find((c) => c.id === conversationId);
  const convMessages = (conversationId && messages[conversationId]) || [];
  const otherUser = conversation?.other_user;
  const isOnline = otherUser ? isUserOnline(otherUser.id) : false;

  const currentTypingUsers = conversationId ? typingUsers[conversationId] : undefined;
  const isOtherTyping = otherUser && currentTypingUsers ? currentTypingUsers.has(otherUser.id) : false;

  // Auto-scroll on initial load and message updates
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isAtBottom) {
      el.scrollTop = el.scrollHeight;
    } else {
      setShowScrollPill(true);
    }
  }, [convMessages.length]);

  // Handle scroll to top for pagination
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || !conversationId) return;

    if (el.scrollTop === 0 && hasMore[conversationId]) {
      const prevScrollHeight = el.scrollHeight;
      loadOlderMessages(conversationId).then(() => {
        // Maintain scroll offset
        if (el) {
          el.scrollTop = el.scrollHeight - prevScrollHeight;
        }
      });
    }

    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (atBottom) {
      setShowScrollPill(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setShowScrollPill(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputBody(val);

    if (!conversationId) return;

    // Send typing indicator
    socketService.send('typing.start', { conversation_id: conversationId });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketService.send('typing.stop', { conversation_id: conversationId });
    }, 2500);
  };

  const handleSend = () => {
    const clean = inputBody.trim();
    if (!clean || !conversationId || clean.length > 2000) return;

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      socketService.send('typing.stop', { conversation_id: conversationId });
    }

    sendMessageOptimistic(conversationId, clean);
    setInputBody('');

    // Force scroll to bottom immediately on send
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-zinc-400">
        Select a conversation to start messaging
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950 overflow-hidden relative">
      {/* Thread Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Back button on mobile */}
          {!embeddedConversationId && (
            <button
              onClick={() => navigate('/inbox')}
              className="lg:hidden p-1.5 -ml-1 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
            >
              <ArrowLeft size={20} />
            </button>
          )}

          {otherUser ? (
            <div className="flex items-center gap-3">
              <Avatar
                username={otherUser.username}
                displayName={otherUser.display_name}
                size="sm"
                isOnline={isOnline}
                hasRing={isOnline}
              />
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {otherUser.display_name || otherUser.username}
                </h2>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {isOnline ? (
                    <span className="text-emerald-500 font-medium">Active now</span>
                  ) : (
                    `@${otherUser.username}`
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-9 flex items-center">
              <span className="text-sm font-medium text-zinc-400">Loading conversation...</span>
            </div>
          )}
        </div>
      </div>

      {/* Message List */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2 overscroll-contain"
      >
        {isLoadingMessages && convMessages.length === 0 ? (
          <MessagesSkeleton />
        ) : (
          <>
            {hasMore[conversationId] && (
              <div className="text-center py-2">
                <span className="text-xs text-zinc-400">Scroll up for older messages</span>
              </div>
            )}

            {convMessages.map((msg, index) => {
              const prevMsg = convMessages[index - 1];
              const nextMsg = convMessages[index + 1];

              const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id;
              const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;

              return (
                <Bubble
                  key={msg.client_id || msg.id}
                  message={msg}
                  isFirstInGroup={isFirstInGroup}
                  isLastInGroup={isLastInGroup}
                />
              );
            })}

            {/* Typing Indicator */}
            {isOtherTyping && (
              <div className="flex items-center gap-2 pl-2 py-1 text-zinc-400 text-xs animate-pulse">
                <span className="inline-flex gap-1 items-center bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.4s]" />
                </span>
                <span className="text-[11px] font-medium">{otherUser?.username} is typing...</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating New Messages Pill */}
      {showScrollPill && <NewMessagePill onClick={scrollToBottom} />}

      {/* Message Input Bar */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex-shrink-0">
        <div className="flex items-end gap-2 bg-zinc-100 dark:bg-zinc-800/80 rounded-3xl p-1.5 px-3 border border-zinc-200 dark:border-zinc-700/60 focus-within:border-rose-500 transition-colors">
          <textarea
            rows={1}
            value={inputBody}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            maxLength={2000}
            className="flex-1 max-h-32 min-h-[36px] bg-transparent resize-none py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none placeholder-zinc-400"
          />

          {inputBody.length > 1800 && (
            <span className="text-[10px] text-amber-500 font-semibold mb-2">
              {2000 - inputBody.length}
            </span>
          )}

          <button
            onClick={handleSend}
            disabled={!inputBody.trim()}
            className={clsx(
              'p-2 rounded-full transition-all flex-shrink-0 mb-0.5',
              inputBody.trim()
                ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md active:scale-90'
                : 'text-zinc-400 hover:text-zinc-500 cursor-not-allowed'
            )}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

