import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const db = getFirestore();
const auth = getAuth();

/**
 * ============================================================================
 * MÓDULO DE CONEXÕES
 * ============================================================================
 */
export async function getConnections() {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado.");

  const q = query(
    collection(db, "connections"),
    where("userId", "==", user.uid),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function saveConnection(name: string, phone: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado.");

  const docRef = await addDoc(collection(db, "connections"), {
    userId: user.uid,
    name,
    phone,
    status: "connected",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * ============================================================================
 * MÓDULO DE CONTATOS
 * ============================================================================
 */
export async function getContacts() {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado.");

  const q = query(collection(db, "contacts"), where("userId", "==", user.uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function saveContact(
  name: string,
  phone: string,
  email: string = "",
) {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado.");

  const docRef = await addDoc(collection(db, "contacts"), {
    userId: user.uid,
    name,
    phone,
    email,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * ============================================================================
 * MÓDULO DE DISPAROS (BROADCASTS)
 * ============================================================================
 */
export async function getBroadcasts() {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado.");

  const q = query(
    collection(db, "broadcasts"),
    where("userId", "==", user.uid),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function saveBroadcast({
  title,
  message,
  connectionId,
  recipientIds,
  scheduledAt,
}: {
  title: string;
  message: string;
  connectionId: string;
  recipientIds: string[];
  scheduledAt?: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado.");

  const docRef = await addDoc(collection(db, "broadcasts"), {
    userId: user.uid,
    title,
    message,
    connectionId,
    recipientIds,
    scheduledAt: scheduledAt || new Date().toISOString(),
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}
