import React, { useState, useEffect } from 'react';
import { friendsApi } from '@/api/friends';
import { FriendRequest } from '@/types';
import { Avatar } from '@/components/Avatar';
import { useToastStore } from '@/store/toastStore';
import { EmptyState } from '@/components/EmptyState';
import { Check, X, Clock, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export const RequestsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const addToast = useToastStore((s) => s.addToast);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await friendsApi.listRequests();
      setIncoming(res.incoming);
      setOutgoing(res.outgoing);
    } catch (err: any) {
      console.error('Failed to load friend requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAccept = async (reqId: string) => {
    try {
      setProcessingId(reqId);
      await friendsApi.acceptRequest(reqId);
      setIncoming((prev) => prev.filter((r) => r.id !== reqId));
      addToast({
        type: 'success',
        title: 'Friend request accepted',
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (reqId: string) => {
    try {
      setProcessingId(reqId);
      await friendsApi.declineRequest(reqId);
      setIncoming((prev) => prev.filter((r) => r.id !== reqId));
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (reqId: string) => {
    try {
      setProcessingId(reqId);
      await friendsApi.cancelRequest(reqId);
      setOutgoing((prev) => prev.filter((r) => r.id !== reqId));
      addToast({
        type: 'info',
        title: 'Request canceled',
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-3">
          Friend Requests
        </h1>

        {/* Tab switcher */}
        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('incoming')}
            className={clsx(
              'flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2',
              activeTab === 'incoming'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            )}
          >
            <span>Incoming</span>
            {incoming.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-rose-500 rounded-full">
                {incoming.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            className={clsx(
              'flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2',
              activeTab === 'outgoing'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            )}
          >
            <span>Sent Requests</span>
            {outgoing.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-700 rounded-full">
                {outgoing.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Request lists */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="animate-spin text-rose-500" size={24} />
          </div>
        ) : activeTab === 'incoming' ? (
          incoming.length === 0 ? (
            <EmptyState
              icon="requests"
              title="No incoming requests"
              description="When other users send you a friend request, they will appear here."
            />
          ) : (
            incoming.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <Avatar
                    username={req.requester.username}
                    displayName={req.requester.display_name}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {req.requester.display_name || req.requester.username}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">
                      @{req.requester.username}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleAccept(req.id)}
                    disabled={processingId === req.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-purple-600 hover:opacity-95 rounded-xl shadow-sm transition-opacity"
                  >
                    <Check size={14} />
                    <span>Confirm</span>
                  </button>
                  <button
                    onClick={() => handleDecline(req.id)}
                    disabled={processingId === req.id}
                    className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )
        ) : outgoing.length === 0 ? (
          <EmptyState
            icon="requests"
            title="No sent requests"
            description="You haven't sent any pending friend requests."
          />
        ) : (
          outgoing.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <Avatar
                  username={req.addressee.username}
                  displayName={req.addressee.display_name}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {req.addressee.display_name || req.addressee.username}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">
                    @{req.addressee.username}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="flex items-center gap-1 text-xs text-zinc-400 mr-1">
                  <Clock size={12} />
                  <span>Pending</span>
                </span>
                <button
                  onClick={() => handleCancel(req.id)}
                  disabled={processingId === req.id}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

