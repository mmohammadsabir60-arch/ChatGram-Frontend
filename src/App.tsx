import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { usePresenceStore } from '@/store/presenceStore';
import { useToastStore } from '@/store/toastStore';
import { socketService } from '@/ws/socket';
import { friendsApi } from '@/api/friends';

import { LoginPage } from '@/pages/LoginPage';
import { InboxPage } from '@/pages/InboxPage';
import { ThreadPage } from '@/pages/ThreadPage';
import { SearchPage } from '@/pages/SearchPage';
import { RequestsPage } from '@/pages/RequestsPage';
import { FriendsPage } from '@/pages/FriendsPage';
import { ProfilePage } from '@/pages/ProfilePage';

import { TabBar } from '@/components/TabBar';
import { ToastContainer } from '@/components/Toast';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated, isLoading, initAuth } = useAuthStore();
  const {
    fetchConversations,
    handleMessageAck,
    handleNewMessage,
    handleMessageDelivered,
    handleMessageSeen,
    handleMessageDeleted,
    handleTyping,
    activeConversationId,
  } = useChatStore();

  const { setOnline, setOffline, setOnlineUsers } = usePresenceStore();
  const addToast = useToastStore((s) => s.addToast);
  const [incomingReqCount, setIncomingReqCount] = useState(0);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Initialize authentication on boot
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Load incoming request count
  useEffect(() => {
    if (isAuthenticated) {
      friendsApi
        .listRequests('incoming')
        .then((res) => setIncomingReqCount(res.incoming_count))
        .catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  // Setup real-time WebSocket listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubs = [
      socketService.on('presence.init', (data) => {
        if (data.online_users) {
          setOnlineUsers(data.online_users);
        }
      }),

      socketService.on('presence', (data) => {
        if (data.status === 'online') {
          setOnline(data.user_id);
        } else {
          setOffline(data.user_id);
        }
      }),

      socketService.on('message.ack', (data) => {
        handleMessageAck(data);
      }),

      socketService.on('message.new', (data) => {
        handleNewMessage(data);
        // Show in-app notification toast if not currently viewing that thread
        if (activeConversationId !== data.conversation_id) {
          addToast({
            type: 'info',
            title: 'New message',
            message: data.body,
          });
        }
      }),

      socketService.on('message.delivered', (data) => {
        handleMessageDelivered(data);
      }),

      socketService.on('message.seen', (data) => {
        handleMessageSeen(data);
      }),

      socketService.on('message.deleted', (data) => {
        handleMessageDeleted(data);
      }),

      socketService.on('typing', (data) => {
        handleTyping(data);
      }),

      socketService.on('friend.request', (data) => {
        setIncomingReqCount((c) => c + 1);
        addToast({
          type: 'info',
          title: 'New friend request',
          message: `@${data.requester.username} sent you a friend request.`,
        });
      }),

      socketService.on('friend.accepted', (data) => {
        addToast({
          type: 'success',
          title: 'Friend request accepted!',
          message: `@${data.friend.username} accepted your request.`,
        });
        fetchConversations();
      }),

      socketService.on('socket.reconnected', () => {
        fetchConversations();
      }),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [
    isAuthenticated,
    activeConversationId,
    fetchConversations,
    handleMessageAck,
    handleNewMessage,
    handleMessageDelivered,
    handleMessageSeen,
    handleMessageDeleted,
    handleTyping,
    setOnline,
    setOffline,
    setOnlineUsers,
    addToast,
  ]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-950">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center text-white mb-4 shadow-xl">
          <Loader2 size={28} className="animate-spin" />
        </div>
        <p className="text-xs font-bold tracking-wider uppercase text-zinc-400">
          Loading Chatgram...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <>
        <ToastContainer />
        <LoginPage />
      </>
    );
  }

  const isThreadView = location.pathname.startsWith('/thread/');

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950">
      {/* Global Toast and Reconnect Banner */}
      <ToastContainer />
      <OfflineBanner />

      {/* Main content viewport */}
      <main className="flex-1 flex overflow-hidden pb-14 lg:pb-0">
        <Routes>
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/inbox/:id" element={<InboxPage />} />
          <Route path="/thread/:id" element={<ThreadPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/inbox" replace />} />
        </Routes>
      </main>

      {/* Mobile TabBar: hidden on dedicated mobile thread page */}
      {!isThreadView && <TabBar incomingRequestsCount={incomingReqCount} />}
    </div>
  );
};
export default App;

