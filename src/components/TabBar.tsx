import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageCircle, Search, UserPlus, Users, User } from 'lucide-react';
import { clsx } from 'clsx';
import { useChatStore } from '@/store/chatStore';

interface TabBarProps {
  incomingRequestsCount?: number;
}

export const TabBar: React.FC<TabBarProps> = ({ incomingRequestsCount = 0 }) => {
  const conversations = useChatStore((s) => s.conversations);
  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  const navItems = [
    {
      to: '/inbox',
      label: 'Messages',
      icon: MessageCircle,
      badge: totalUnread,
    },
    {
      to: '/search',
      label: 'Search',
      icon: Search,
    },
    {
      to: '/requests',
      label: 'Requests',
      icon: UserPlus,
      badge: incomingRequestsCount,
    },
    {
      to: '/friends',
      label: 'Friends',
      icon: Users,
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 pb-safe">
      <div className="flex items-center justify-around h-14 max-w-md mx-auto px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'relative flex flex-col items-center justify-center p-2 rounded-xl transition-all',
                isActive
                  ? 'text-rose-500 scale-105 font-medium'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="absolute -top-1.5 -right-2.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white dark:ring-zinc-950">
                      {item.badge! > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

