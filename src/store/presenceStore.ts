import { create } from 'zustand';

interface PresenceState {
  onlineUserIds: Set<string>;
  setOnline: (userId: string) => void;
  setOffline: (userId: string) => void;
  setOnlineUsers: (userIds: string[]) => void;
  isOnline: (userId: string) => boolean;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUserIds: new Set<string>(),

  setOnline: (userId: string) => {
    set((state) => {
      const updated = new Set(state.onlineUserIds);
      updated.add(userId);
      return { onlineUserIds: updated };
    });
  },

  setOffline: (userId: string) => {
    set((state) => {
      const updated = new Set(state.onlineUserIds);
      updated.delete(userId);
      return { onlineUserIds: updated };
    });
  },

  setOnlineUsers: (userIds: string[]) => {
    set({ onlineUserIds: new Set(userIds) });
  },

  isOnline: (userId: string) => {
    return get().onlineUserIds.has(userId);
  },
}));

