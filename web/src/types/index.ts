import type { Timestamp } from "firebase/firestore";

export type Connection = {
  id: string;
  userId: string;
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Contact = {
  id: string;
  userId: string;
  connectionId: string;
  name: string;
  phone: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type MessageStatus = "scheduled" | "sent";

export type Message = {
  id: string;
  userId: string;
  connectionId: string;
  contactIds: string[];
  text: string;
  status: MessageStatus;
  scheduledAt: Timestamp | null;
  sentAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
