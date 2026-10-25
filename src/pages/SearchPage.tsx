import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '@/api/users';
import { friendsApi } from '@/api/friends';
import { chatApi } from '@/api/chat';
import { UserSearchResult } from '@/types';
import { UserRow } from '@/components/UserRow';
import { useDebounce } from '@/hooks/useDebounce';
import { useToastStore } from '@/store/toastStore';
import { useChatStore } from '@/store/chatStore';
import { Search, Loader2 } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingUser, setActionLoadingUser] = useState<string | null>(null);

  const addToast = useToastStore((s) => s.addToast);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    usersApi
      .searchUsers(debouncedQuery)
      .then((res) => {
        if (isMounted) {
          setResults(res.items);
        }
      })
      .catch((err) => {
        console.error('Search failed', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  const handleSendRequest = async (targetUsername: string) => {
    try {
      setActionLoadingUser(targetUsername);
      await friendsApi.sendRequest(targetUsername);
      addToast({
        type: 'success',
        title: 'Friend request sent',
        message: `Sent request to @${targetUsername}`,
      });
      // Update UI state
      setResults((prev) =>
        prev.map((u) =>
          u.username === targetUsername
            ? { ...u, relationship_state: 'request_sent' as const }
            : u
        )
      );
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Could not send request',
        message: err.message,
      });
    } finally {
      setActionLoadingUser(null);
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      await friendsApi.acceptRequest(friendshipId);
      addToast({
        type: 'success',
        title: 'Friend request accepted',
      });
      setResults((prev) =>
        prev.map((u) =>
          u.friendship_id === friendshipId
            ? { ...u, relationship_state: 'friends' as const }
            : u
        )
      );
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const handleDeclineRequest = async (friendshipId: string) => {
    try {
      await friendsApi.declineRequest(friendshipId);
      setResults((prev) =>
        prev.map((u) =>
          u.friendship_id === friendshipId
            ? { ...u, relationship_state: 'none' as const, friendship_id: null }
            : u
        )
      );
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

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

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Search Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-3">
          Search
        </h1>
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username or name..."
            autoFocus
            className="w-full pl-10 pr-10 py-2.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
          />
          {loading && (
            <Loader2
              size={18}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-rose-500"
            />
          )}
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-2">
        {results.length > 0 ? (
          <div className="space-y-1">
            {results.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onSendRequest={handleSendRequest}
                onAcceptRequest={handleAcceptRequest}
                onDeclineRequest={handleDeclineRequest}
                onOpenChat={handleOpenChat}
                isActionLoading={actionLoadingUser === user.username}
              />
            ))}
          </div>
        ) : debouncedQuery.trim() ? (
          !loading && (
            <div className="text-center py-12 text-sm text-zinc-400">
              No users found matching "{debouncedQuery}".
            </div>
          )
        ) : (
          <div className="text-center py-16 text-xs text-zinc-400 max-w-xs mx-auto">
            Search for people by their @username or display name to connect and chat.
          </div>
        )}
      </div>
    </div>
  );
};

