import React from 'react';
import { clsx } from 'clsx';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={clsx(
        'animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded-lg',
        className
      )}
    />
  );
};

export const ChatRowSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-3.5 p-3.5">
      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="w-28 h-4 rounded" />
          <Skeleton className="w-12 h-3 rounded" />
        </div>
        <Skeleton className="w-48 h-3.5 rounded" />
      </div>
    </div>
  );
};

export const MessagesSkeleton: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-start">
        <Skeleton className="w-48 h-10 rounded-3xl" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="w-64 h-12 rounded-3xl" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="w-56 h-10 rounded-3xl" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="w-36 h-9 rounded-3xl" />
      </div>
    </div>
  );
};

