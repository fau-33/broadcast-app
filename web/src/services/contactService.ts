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
  // Monta objeto sem valores 'undefined'
  const dataToSave: Record<string, unknown> = {
    name: contactData.name,
    phone: contactData.phone,
    userId: contactData.userId,
    createdAt: new Date().toISOString(),
  };

  if (contactData.email && contactData.email.trim() !== "") {
    dataToSave.email = contactData.email.trim();
  }

  const docRef = await addDoc(collection(db, COLLECTION_NAME), dataToSave);
  return docRef.id;
}

export async function updateContact(
  id: string,
  contactData: Partial<Omit<Contact, "id" | "userId" | "createdAt">>,
) {
  const docRef = doc(db, COLLECTION_NAME, id);
  const dataToUpdate: Record<string, unknown> = {};

  if (contactData.name !== undefined) dataToUpdate.name = contactData.name;
  if (contactData.phone !== undefined) dataToUpdate.phone = contactData.phone;
  if (contactData.email !== undefined) dataToUpdate.email = contactData.email;

  await updateDoc(docRef, dataToUpdate);
}

export async function deleteContact(id: string) {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}
