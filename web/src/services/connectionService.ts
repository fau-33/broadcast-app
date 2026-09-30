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
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { Connection } from "../types/connection";

const COLLECTION_NAME = "connections";

export async function createConnection(
  name: string,
  userId: string,
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    name,
    userId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getConnections(userId: string): Promise<Connection[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId),
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Connection, "id">),
  }));
}

export async function updateConnection(
  id: string,
  name: string,
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { name });
}

export async function deleteConnection(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}
