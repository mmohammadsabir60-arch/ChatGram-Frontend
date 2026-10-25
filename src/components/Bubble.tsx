import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Check, CheckCheck, Clock, MoreHorizontal, Trash2 } from 'lucide-react';
import { Message } from '@/types';
import { chatApi } from '@/api/chat';
import { useChatStore } from '@/store/chatStore';

interface BubbleProps {
  message: Message;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

export const Bubble: React.FC<BubbleProps> = ({
  message,
  isFirstInGroup = true,
  isLastInGroup = true,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const handleMessageDeleted = useChatStore((s) => s.handleMessageDeleted);

  const isMine = Boolean(message.is_mine);
  const isDeleted = Boolean(message.deleted_for_all);

  const handleUnsend = async () => {
    try {
      setShowMenu(false);
      await chatApi.deleteMessage(message.id, 'all');
      handleMessageDeleted({
        message_id: message.id,
        conversation_id: message.conversation_id,
        scope: 'all',
      });
    } catch (err) {
      console.error('Failed to unsend message', err);
    }
  };

  const formattedTime = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={clsx(
        'group relative flex flex-col mb-1',
        isMine ? 'items-end' : 'items-start'
      )}
    >
      <div className="flex items-center gap-1.5 max-w-[78%] md:max-w-[65%]">
        {/* Unsend dropdown trigger for sent messages */}
        {isMine && !isDeleted && message.id > 0 && (
          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Message options"
            >
              <MoreHorizontal size={14} />
            </button>

            {showMenu && (
              <div className="absolute right-0 bottom-full mb-1 w-32 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-20">
                <button
                  onClick={handleUnsend}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-500 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                >
                  <Trash2 size={13} />
                  <span>Unsend</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={clsx(
            'px-4 py-2.5 text-[15px] leading-relaxed break-words shadow-sm transition-all',
            isMine
              ? clsx(
                  'bg-gradient-to-tr from-rose-500 via-pink-600 to-purple-600 text-white',
                  isFirstInGroup && isLastInGroup && 'rounded-3xl',
                  isFirstInGroup && !isLastInGroup && 'rounded-t-3xl rounded-l-3xl rounded-br-md',
                  !isFirstInGroup && isLastInGroup && 'rounded-b-3xl rounded-l-3xl rounded-tr-md',
                  !isFirstInGroup && !isLastInGroup && 'rounded-l-3xl rounded-r-md'
                )
              : clsx(
                  'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100',
                  isFirstInGroup && isLastInGroup && 'rounded-3xl',
                  isFirstInGroup && !isLastInGroup && 'rounded-t-3xl rounded-r-3xl rounded-bl-md',
                  !isFirstInGroup && isLastInGroup && 'rounded-b-3xl rounded-r-3xl rounded-tl-md',
                  !isFirstInGroup && !isLastInGroup && 'rounded-r-3xl rounded-l-md'
                ),
            isDeleted && 'italic text-opacity-80'
          )}
        >
          {isDeleted ? 'This message was unsent' : message.body}
        </div>
      </div>

      {/* Timestamp & Status indicator on the last bubble of consecutive group */}
      {isLastInGroup && (
        <div
          className={clsx(
            'flex items-center gap-1 mt-0.5 px-1 text-[11px] text-zinc-400 select-none',
            isMine ? 'justify-end' : 'justify-start'
          )}
        >
          <span>{formattedTime}</span>
          {isMine && !isDeleted && (
            <span className="inline-flex items-center">
              {message.status === 'sending' && (
                <Clock size={11} className="animate-spin text-zinc-400" />
              )}
              {message.status === 'sent' && (
                <Check size={12} className="text-zinc-400" />
              )}
              {message.status === 'delivered' && (
                <CheckCheck size={13} className="text-zinc-400" />
              )}
              {message.status === 'seen' && (
                <span className="font-semibold text-rose-500 dark:text-rose-400">Seen</span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

