/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  data?: any;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  // eslint-disable-next-line no-unused-vars
  markAsRead: (input: { id: string }) => void;
  refresh: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationsProvider />");
  return ctx;
};

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Listen to Firestore notifications for the current user
  useEffect(() => {
    if (!user?.email) return;
    const q = query(
      collection(db, "notifications"),
      where("userEmail", "==", user.email),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const items: Notification[] = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          type: d.type || "info",
          title: d.title || "",
          message: d.message || "",
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
          read: !!d.read,
          data: d.data || {},
        };
      });
      setNotifications(items);
    });
    return () => unsub();
  }, [user?.email]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Mark a notification as read (client-side only; extend to Firestore if needed)
  const markAsRead = ({ id }: { id: string }) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    // TODO: Optionally update Firestore to mark as read
  };

  // Manual refresh (re-fetch)
  const refresh = () => {
    // No-op: onSnapshot keeps in sync
  };

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, refresh }}>
      {children}
    </NotificationsContext.Provider>
  );
};
