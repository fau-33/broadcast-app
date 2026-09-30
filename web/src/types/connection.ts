export interface Connection {
  id: string;
  name: string;
  phone?: string;
  userId: string;
  status?: "disconnected" | "connecting" | "connected";
  createdAt?: string;
}
