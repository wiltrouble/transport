import { create } from "zustand";
import type { AppNotification } from "@school/types";
import { notificationService } from "@/services/notificationService";

type NotificationsState = {
  notifications: AppNotification[];
  unreadCount: number;
  connected: boolean;
  isLoading: boolean;
  loadNotifications: (parentId: string) => Promise<void>;
  mergeNotification: (notification: AppNotification) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  setConnected: (connected: boolean) => void;
  reset: () => void;
};

function countUnread(list: AppNotification[]): number {
  return list.filter((n) => !n.isRead).length;
}

export const useParentNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  connected: false,
  isLoading: false,

  reset: () => set({ notifications: [], unreadCount: 0, connected: false }),

  setConnected: (connected) => set({ connected }),

  loadNotifications: async (parentId) => {
    set({ isLoading: true });
    try {
      const notifications = await notificationService.listForParent(parentId);
      set({ notifications, unreadCount: countUnread(notifications) });
    } finally {
      set({ isLoading: false });
    }
  },

  mergeNotification: (notification) => {
    set((state) => {
      const rest = state.notifications.filter((n) => n.id !== notification.id);
      const notifications = [notification, ...rest].sort(
        (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
      );
      return { notifications, unreadCount: countUnread(notifications) };
    });
  },

  markAsRead: async (notificationId) => {
    const updated = await notificationService.markNotificationAsRead(notificationId);
    get().mergeNotification(updated);
  },
}));
