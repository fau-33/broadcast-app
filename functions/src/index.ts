import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * ============================================================================
 * SERVIÇO CLOUD FUNCTIONS - BROADCAST APP
 * ============================================================================
 *
 * Módulo centralizado de Cloud Functions para a aplicação Broadcast App.
 * Processa todas as requisições autenticadas de clientes para operações
 * no Firestore, incluindo:
 * - Gerenciamento de conexões WhatsApp/Telegram
 * - Gerenciamento de contatos de destinatários
 * - Criação e agendamento de campanhas de broadcast
 *
 * Segurança:
 * - Todas as funções validam autenticação Firebase
 * - Isolamento de dados por userId (usuário autenticado)
 * - Validação de entrada de dados obrigatórios
 * - Tratamento centralizado de erros com mensagens específicas
 */

// Inicializa o Admin SDK do Firebase com acesso privilegiado ao Firestore
admin.initializeApp();
const db = admin.firestore();

/**
 * ============================================================================
 * MÓDULO DE CONEXÕES
 * ============================================================================
 * Gerencia as conexões WhatsApp/Telegram que serão usadas para disparar
 * mensagens em campanhas de broadcast.
 */

/**
 * Recupera todas as conexões do usuário autenticado
 *
 * Cloud Function: HTTP Callable
 *
 * @param request - Contextodo Firebase com autenticação
 * @returns {success: boolean, data: Connection[]} Array de conexões do usuário
 * @throws HttpsError "unauthenticated" se usuário não autenticado
 * @throws HttpsError "internal" se erro ao consultar Firestore
 *
 * Estrutura de conexão:
 * - id: String gerado pelo Firestore
 * - userId: UID do proprietário (do request.auth)
 * - name: Nome identificador da conexão
 * - phone: Número de telefone
 * - status: "connected" | "disconnected"
 * - createdAt: Timestamp do servidor
 */
export const getConnections = functions.https.onCall(async (request) => {
  const auth = request.auth;

  // Validação de autenticação
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

    return { success: true, data: connections };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    throw new functions.https.HttpsError("internal", message);
  }
});

/**
 * Cria uma nova conexão WhatsApp/Telegram para o usuário autenticado
 *
 * Cloud Function: HTTP Callable
 *
 * @param request - Contexto do Firebase com autenticação
 * @param request.data - Objeto com:
 *   - name: String - Nome da conexão (obrigatório)
 *   - phone: String - Número de telefone (obrigatório)
 *   - status: String - Status da conexão (opcional, padrão: "connected")
 * @returns {success: boolean, id: string} ID do documento criado
 * @throws HttpsError "unauthenticated" se usuário não autenticado
 * @throws HttpsError "invalid-argument" se campos obrigatórios faltando
 * @throws HttpsError "internal" se erro ao criar documento
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
  const { name, phone, status } = request.data as {
    name: string;
    phone: string;
    status?: string;
  };

  // Validação de campos obrigatórios
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

    return { success: true, id: newConnRef.id };
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
 * Gerencia os contatos que serão destinatários das campanhas de broadcast.
 * Suporta armazenamento de nome, telefone e email.
 */

/**
 * Recupera todos os contatos do usuário autenticado
 *
 * Cloud Function: HTTP Callable
 *
 * @param request - Contexto do Firebase com autenticação
 * @returns {success: boolean, data: Contact[]} Array de contatos do usuário
 * @throws HttpsError "unauthenticated" se usuário não autenticado
 * @throws HttpsError "internal" se erro ao consultar Firestore
 *
 * Estrutura de contato:
 * - id: String gerado pelo Firestore
 * - userId: UID do proprietário (do request.auth)
 * - name: Nome completo do contato
 * - phone: Número de telefone (principal identificador para envios)
 * - email: Email do contato (opcional)
 * - createdAt: Timestamp do servidor
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

    return { success: true, data: contacts };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    throw new functions.https.HttpsError("internal", message);
  }
});

/**
 * Cria um novo contato para o usuário autenticado
 *
 * Cloud Function: HTTP Callable
 *
 * @param request - Contexto do Firebase com autenticação
 * @param request.data - Objeto com:
 *   - name: String - Nome completo (obrigatório)
 *   - phone: String - Número de telefone (obrigatório)
 *   - email: String - Email do contato (opcional)
 * @returns {success: boolean, id: string} ID do documento criado
 * @throws HttpsError "unauthenticated" se usuário não autenticado
 * @throws HttpsError "invalid-argument" se campos obrigatórios faltando
 * @throws HttpsError "internal" se erro ao criar documento
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
  const { name, phone, email } = request.data as {
    name: string;
    phone: string;
    email?: string;
  };

  // Validação de campos obrigatórios
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

    return { success: true, id: newContactRef.id };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    throw new functions.https.HttpsError("internal", message);
  }
});

/**
 * ============================================================================
 * MÓDULO DE BROADCASTS (CAMPANHAS DE DISPARO EM MASSA)
 * ============================================================================
 * Gerencia as campanhas de broadcast que disparam mensagens para múltiplos
 * contatos via conexão WhatsApp/Telegram. Suporta agendamento e rastreamento
 * de status das campanhas.
 */

/**
 * Recupera todas as campanhas de broadcast do usuário autenticado
 *
 * Cloud Function: HTTP Callable
 *
 * @param request - Contexto do Firebase com autenticação
 * @returns {success: boolean, data: Broadcast[]} Array de campanhas do usuário
 * @throws HttpsError "unauthenticated" se usuário não autenticado
 * @throws HttpsError "internal" se erro ao consultar Firestore
 *
 * Estrutura de broadcast:
 * - id: String gerado pelo Firestore
 * - userId: UID do proprietário (do request.auth)
 * - title: Título da campanha
 * - message: Conteúdo da mensagem a disparar
 * - connectionId: ID da conexão WhatsApp/Telegram a usar
 * - recipientIds: Array de IDs dos contatos destinatários
 * - scheduledAt: ISO string da data/hora agendada
 * - status: "pending" | "sent" | "failed" | "completed"
 * - createdAt: Timestamp do servidor
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

    return { success: true, data: broadcasts };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    throw new functions.https.HttpsError("internal", message);
  }
});

/**
 * Cria e agenda uma nova campanha de broadcast para o usuário autenticado
 *
 * Cloud Function: HTTP Callable
 *
 * @param request - Contexto do Firebase com autenticação
 * @param request.data - Objeto com:
 *   - title: String - Título da campanha (obrigatório)
 *   - message: String - Conteúdo da mensagem (obrigatório)
 *   - connectionId: String - ID da conexão a usar (obrigatório)
 *   - recipientIds: String[] - IDs dos contatos destinatários (obrigatório)
 *   - scheduledAt: String - Data/hora ISO para agendamento (opcional, padrão: agora)
 * @returns {success: boolean, id: string} ID do documento broadcast criado
 * @throws HttpsError "unauthenticated" se usuário não autenticado
 * @throws HttpsError "invalid-argument" se campos obrigatórios faltando
 * @throws HttpsError "internal" se erro ao criar documento
 *
 * Nota:
 * - A mensagem será disparada para todos os IDs em recipientIds
 * - Se scheduledAt não fornecido, disparo é imediato
 * - Status inicial é "pending", muda conforme processamento
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
  const { title, message, connectionId, scheduledAt, recipientIds } =
    request.data as {
      title: string;
      message: string;
      connectionId: string;
      scheduledAt?: string;
      recipientIds: string[];
    };

  // Validação de campos obrigatórios
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

    return { success: true, id: newBroadcastRef.id };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    throw new functions.https.HttpsError("internal", message);
  }
});
