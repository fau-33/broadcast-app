import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { Broadcast } from "../types/broadcast";

const COLLECTION_NAME = "broadcasts";

export async function getBroadcasts(userId: string): Promise<Broadcast[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Broadcast[];
}

export async function createBroadcast(
  broadcastData: Omit<Broadcast, "id" | "createdAt">,
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...broadcastData,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateBroadcast(id: string, data: Partial<Broadcast>) {
  const docRef = doc(db, "broadcasts", id);
  await updateDoc(docRef, data);
}

export async function deleteBroadcast(id: string) {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}
