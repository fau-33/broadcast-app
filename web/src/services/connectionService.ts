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
import type { Connection } from "../types/connection";

const COLLECTION_NAME = "connections";

export async function getConnections(userId: string): Promise<Connection[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Connection[];
}

export async function createConnection(
  name: string,
  userId: string,
  phone?: string,
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    name,
    phone: phone || "",
    status: "disconnected",
    userId,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateConnection(
  id: string,
  name: string,
  phone?: string,
) {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { name, phone: phone || "" });
}

export async function updateConnectionStatus(
  id: string,
  status: "connected" | "disconnected",
  phone?: string,
) {
  const docRef = doc(db, COLLECTION_NAME, id);
  const dataToUpdate: Record<string, unknown> = { status };
  if (phone !== undefined) {
    dataToUpdate.phone = phone;
  }
  await updateDoc(docRef, dataToUpdate);
}

export async function deleteConnection(id: string) {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}
