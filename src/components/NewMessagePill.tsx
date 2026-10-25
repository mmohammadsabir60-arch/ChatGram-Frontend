import React from 'react';
import { ArrowDown } from 'lucide-react';

interface NewMessagePillProps {
  onClick: () => void;
  count?: number;
}

export const NewMessagePill: React.FC<NewMessagePillProps> = ({ onClick, count = 1 }) => {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all animate-bounce text-xs font-semibold"
    >
      <ArrowDown size={14} />
      <span>{count > 1 ? `${count} new messages` : 'New message'}</span>
    </button>
  );
};

