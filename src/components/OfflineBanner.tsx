import React, { useEffect, useState } from 'react';
import { socketService, SocketStatus } from '@/ws/socket';
import { WifiOff, RefreshCw } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [status, setStatus] = useState<SocketStatus>(socketService.currentStatus);

  useEffect(() => {
    return socketService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });
  }, []);

  if (status === 'connected') return null;

  return (
    <div className="bg-amber-500 text-white px-4 py-2 text-xs font-medium flex items-center justify-between shadow-sm z-40 transition-all">
      <div className="flex items-center gap-2">
        <WifiOff size={14} className="animate-pulse" />
        <span>
          {status === 'connecting'
            ? 'Connecting to Chatgram server...'
            : 'Offline. Reconnecting automatically...'}
        </span>
      </div>

      <button
        onClick={() => socketService.connect()}
        className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-md text-[11px] font-semibold active:scale-95 transition-all"
      >
        <RefreshCw size={11} className={status === 'connecting' ? 'animate-spin' : ''} />
        <span>Retry Now</span>
      </button>
    </div>
  );
};

