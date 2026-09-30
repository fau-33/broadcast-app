export interface Broadcast {
  id: string;
  title: string;
  message: string;
  connectionId: string;
  connectionName: string;
  recipientsType: "all" | "selected";
  recipientIds: string[];
  recipientCount: number;
  status: "scheduled" | "sent" | "failed";
  scheduledAt: string;
  sentAt?: string;
  userId: string;
  createdAt: string;
}
