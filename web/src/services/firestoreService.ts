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
 * SERVIÇO DE FIRESTORE - MÓDULO DE CONEXÕES
 * ============================================================================
 * Gerencia as operações relacionadas a conexões WhatsApp/Telegram dos usuários.
 * Inclui consulta e criação de conexões com isolamento por usuário autenticado.
 */

/**
 * Recupera todas as conexões do usuário autenticado
 *
 * @returns Array de objetos conexão com id, name, phone, status, createdAt
 * @throws Error se o usuário não estiver autenticado
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

/**
 * Cria nova conexão WhatsApp/Telegram para o usuário autenticado
 *
 * @param name - Nome identificador da conexão
 * @param phone - Número de telefone da conexão
 * @returns ID do documento criado no Firestore
 * @throws Error se o usuário não estiver autenticado
 */
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
 * SERVIÇO DE FIRESTORE - MÓDULO DE CONTATOS
 * ============================================================================
 * Gerencia os contatos de destino para disparos de broadcasts.
 * Armazena informações de contatos com nome, telefone e email opcionais.
 */

/**
 * Recupera todos os contatos do usuário autenticado
 *
 * @returns Array de objetos contato com id, name, phone, email, createdAt
 * @throws Error se o usuário não estiver autenticado
 */
export async function getContacts() {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado.");

  const q = query(collection(db, "contacts"), where("userId", "==", user.uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Cria novo contato para o usuário autenticado
 *
 * @param name - Nome completo do contato
 * @param phone - Número de telefone (obrigatório para WhatsApp)
 * @param email - Email do contato (opcional)
 * @returns ID do documento criado no Firestore
 * @throws Error se o usuário não estiver autenticado
 */
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
 * SERVIÇO DE FIRESTORE - MÓDULO DE DISPAROS (BROADCASTS)
 * ============================================================================
 * Gerencia os broadcasts (campanhas de mensagens em massa) do usuário.
 * Suporta agendamento de disparos e rastreamento de status (pending/sent/failed).
 */

/**
 * Recupera todos os broadcasts (campanhas) do usuário autenticado
 *
 * @returns Array de objetos broadcast com id, title, message, status, createdAt, etc
 * @throws Error se o usuário não estiver autenticado
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

/**
 * Cria novo broadcast (campanha de disparos em massa)
 *
 * @param params - Objeto contendo:
 *   - title: Título descritivo da campanha
 *   - message: Conteúdo da mensagem a ser disparada
 *   - connectionId: ID da conexão WhatsApp/Telegram a usar
 *   - recipientIds: Array de IDs dos contatos destinatários
 *   - scheduledAt: Data/hora agendada (opcional - padrão é agora)
 * @returns ID do documento broadcast criado no Firestore
 * @throws Error se o usuário não estiver autenticado
 */
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
