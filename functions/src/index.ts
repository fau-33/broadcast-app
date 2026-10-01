import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Inicializa o Admin SDK do Firebase para interagir com o Firestore
admin.initializeApp();
const db = admin.firestore();

/**
 * ============================================================================
 * MÓDULO DE CONEXÕES
 * ============================================================================
 */

/**
 * Lista todas as conexões de WhatsApp pertencentes ao usuário autenticado.
 * Utiliza coleção raiz 'connections' e filtra por userId para garantir
 * isolamento.
 */
export const getConnections = functions.https.onCall(async (request) => {
  const auth = request.auth;

  // Valida se o cliente está autenticado na requisição
  if (!auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "O usuário precisa estar autenticado.",
    );
  }

  const userId = auth.uid;

  try {
    const snapshot = await db
      .collection("connections")
      .where("userId", "==", userId)
      .get();

    const connections = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {success: true, data: connections};
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    throw new functions.https.HttpsError("internal", message);
  }
});

/**
 * Cria uma nova conexão de WhatsApp para o usuário autenticado.
 */
export const saveConnection = functions.https.onCall(async (request) => {
  const auth = request.auth;

  if (!auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Usuário não autenticado.",
    );
  }

  const userId = auth.uid;
  const {name, phone, status} = request.data as {
    name: string;
    phone: string;
    status?: string;
  };

  if (!name || !phone) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Nome e telefone são obrigatórios.",
    );
  }

  try {
    const newConnRef = await db.collection("connections").add({
      userId,
      name,
      phone,
      status: status || "connected",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {success: true, id: newConnRef.id};
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    throw new functions.https.HttpsError("internal", message);
  }
});

/**
 * ============================================================================
 * MÓDULO DE CONTATOS
 * ============================================================================
 */

/**
 * Lista todos os contatos pertencentes ao usuário autenticado.
 * Utiliza coleção raiz 'contacts' filtrando por userId para isolamento.
 */
export const getContacts = functions.https.onCall(async (request) => {
  const auth = request.auth;

  if (!auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "O usuário precisa estar autenticado.",
    );
  }

  const userId = auth.uid;

  try {
    const snapshot = await db
      .collection("contacts")
      .where("userId", "==", userId)
      .get();

    const contacts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {success: true, data: contacts};
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    throw new functions.https.HttpsError("internal", message);
  }
});

/**
 * Cria um novo contato para o usuário autenticado.
 */
export const saveContact = functions.https.onCall(async (request) => {
  const auth = request.auth;

  if (!auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Usuário não autenticado.",
    );
  }

  const userId = auth.uid;
  const {name, phone, email} = request.data as {
    name: string;
    phone: string;
    email?: string;
  };

  if (!name || !phone) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Nome e telefone são obrigatórios.",
    );
  }

  try {
    const newContactRef = await db.collection("contacts").add({
      userId,
      name,
      phone,
      email: email || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {success: true, id: newContactRef.id};
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    throw new functions.https.HttpsError("internal", message);
  }
});

/**
 * ============================================================================
 * MÓDULO DE BROADCASTS (DISPAROS)
 * ============================================================================
 */

/**
 * Lista todas as campanhas de broadcast criadas pelo usuário autenticado.
 */
export const getBroadcasts = functions.https.onCall(async (request) => {
  const auth = request.auth;

  if (!auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "O usuário precisa estar autenticado.",
    );
  }

  const userId = auth.uid;

  try {
    const snapshot = await db
      .collection("broadcasts")
      .where("userId", "==", userId)
      .get();

    const broadcasts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {success: true, data: broadcasts};
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    throw new functions.https.HttpsError("internal", message);
  }
});

/**
 * Cria e agenda/dispara uma nova campanha de broadcast.
 */
export const saveBroadcast = functions.https.onCall(async (request) => {
  const auth = request.auth;

  if (!auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Usuário não autenticado.",
    );
  }

  const userId = auth.uid;
  const {title, message, connectionId, scheduledAt, recipientIds} =
    request.data as {
      title: string;
      message: string;
      connectionId: string;
      scheduledAt?: string;
      recipientIds: string[];
    };

  if (!title || !message || !connectionId || !recipientIds) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Campos obrigatórios faltando na campanha.",
    );
  }

  try {
    const newBroadcastRef = await db.collection("broadcasts").add({
      userId,
      title,
      message,
      connectionId,
      scheduledAt: scheduledAt || new Date().toISOString(),
      recipientIds,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {success: true, id: newBroadcastRef.id};
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    throw new functions.https.HttpsError("internal", message);
  }
});
