import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { Connection } from "../types/connection";

export async function getConnections(userId: string): Promise<Connection[]> {
  const q = query(collection(db, "connections"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name || "",
      status: data.status || "disconnected",
      userId: data.userId || userId,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : data.createdAt || new Date().toISOString(),
    };
  });
}

export async function createConnection(
  name: string,
  userId: string,
): Promise<string> {
  const docRef = await addDoc(collection(db, "connections"), {
    name,
    userId,
    status: "disconnected",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateConnection(
  id: string,
  name: string,
): Promise<void> {
  const connectionRef = doc(db, "connections", id);
  await updateDoc(connectionRef, { name });
}

export async function updateConnectionStatus(
  id: string,
  status: "connected" | "disconnected",
): Promise<void> {
  const connectionRef = doc(db, "connections", id);
  await updateDoc(connectionRef, { status });
}

export async function deleteConnection(id: string): Promise<void> {
  const connectionRef = doc(db, "connections", id);
  await deleteDoc(connectionRef);
}
