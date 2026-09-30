export interface Connection {
  id: string;
  name: string;
  userId: string;
  status?: "disconnected" | "connecting" | "connected";
  createdAt?: string;
}
