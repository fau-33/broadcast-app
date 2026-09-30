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
import type { Contact } from "../types/contact";

const COLLECTION_NAME = "contacts";

export async function getContacts(userId: string): Promise<Contact[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Contact[];
}

export async function createContact(
  contactData: Omit<Contact, "id" | "createdAt">,
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...contactData,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateContact(
  id: string,
  contactData: Partial<Omit<Contact, "id" | "userId" | "createdAt">>,
) {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, contactData);
}

export async function deleteContact(id: string) {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}
