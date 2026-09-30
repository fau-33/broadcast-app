import { useState, useEffect, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { getConnections } from "../services/connectionService";
import { getContacts } from "../services/contactService";
import {
  getBroadcasts,
  createBroadcast,
  deleteBroadcast,
} from "../services/broadcastService";
import type { Connection } from "../types/connection";
import type { Contact } from "../types/contact";
import type { Broadcast } from "../types/broadcast";

export function Broadcasts() {
  const { user, loading: authLoading } = useAuth();

  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Formulário
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [sendOption, setSendOption] = useState<"now" | "schedule">("now");
  const [scheduledDate, setScheduledDate] = useState("");

  const [broadcastToDelete, setBroadcastToDelete] = useState<Broadcast | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      void Promise.resolve().then(() => {
        setBroadcasts([]);
        setLoading(false);
      });
      return;
    }

    let isMounted = true;

    const fetchAllData = async () => {
      try {
        // Busca resiliente: se um falhar, os outros carregam normalmente
        const [bData, cData, ctData] = await Promise.allSettled([
          getBroadcasts(user.uid),
          getConnections(user.uid),
          getContacts(user.uid),
        ]);

        if (isMounted) {
          const loadedBroadcasts =
            bData.status === "fulfilled" ? bData.value : [];
          const loadedConnections =
            cData.status === "fulfilled" ? cData.value : [];
          const loadedContacts =
            ctData.status === "fulfilled" ? ctData.value : [];

          setBroadcasts(loadedBroadcasts);
          setConnections(loadedConnections);
          setContacts(loadedContacts);

          // Seleciona automaticamente o primeiro canal disponível/conectado
          const activeConns = loadedConnections.filter(
            (c) => c.status === "connected",
          );
          if (activeConns.length > 0) {
            setSelectedConnectionId(activeConns[0].id);
          } else if (loadedConnections.length > 0) {
            setSelectedConnectionId(loadedConnections[0].id);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError("Falha ao carregar dados de disparos.");
        }
        console.error(err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || !selectedConnectionId || !user) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (contacts.length === 0) {
      setError(
        "Você precisa ter pelo menos 1 contato cadastrado para disparar.",
      );
      return;
    }

    const conn = connections.find((c) => c.id === selectedConnectionId);
    if (!conn) {
      setError("Selecione um canal válido.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    const isImmediate = sendOption === "now";
    const status: "sent" | "scheduled" = isImmediate ? "sent" : "scheduled";
    const scheduledAt = isImmediate
      ? new Date().toISOString()
      : new Date(scheduledDate).toISOString();

    try {
      const payload: Omit<Broadcast, "id" | "createdAt"> = {
        title: title.trim(),
        message: message.trim(),
        connectionId: conn.id,
        connectionName: conn.name,
        recipientsType: "all",
        recipientIds: contacts.map((c) => c.id),
        recipientCount: contacts.length,
        status,
        scheduledAt,
        sentAt: isImmediate ? new Date().toISOString() : undefined,
        userId: user.uid,
      };

      const newId = await createBroadcast(payload);

      const newBroadcastItem: Broadcast = {
        id: typeof newId === "string" ? newId : Date.now().toString(),
        ...payload,
        createdAt: new Date().toISOString(),
      };

      setBroadcasts((prev) => [newBroadcastItem, ...prev]);
      setSuccess(
        isImmediate
          ? "Disparo realizado com sucesso!"
          : "Agendamento criado com sucesso!",
      );

      setTitle("");
      setMessage("");
      setScheduledDate("");
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar disparo.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!broadcastToDelete) return;
    const targetId = broadcastToDelete.id;
    setBroadcastToDelete(null);

    setBroadcasts((prev) => prev.filter((b) => b.id !== targetId));

    try {
      await deleteBroadcast(targetId);
    } catch (err) {
      console.error(err);
      setError("Erro ao excluir registro de disparo.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Cabeçalho */}
        <header className="flex flex-col gap-2">
          <Link
            to="/dashboard"
            className="w-fit flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Voltar ao Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <svg
              className="w-8 h-8 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Disparos & Agendamentos
          </h1>
          <p className="text-slate-400">
            Crie campanhas, selecione o canal e envie mensagens instantâneas ou
            agendadas.
          </p>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-fade-in">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm animate-fade-in">
            {success}
          </div>
        )}

        {/* Formulário de Novo Disparo */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl shadow-lg space-y-4">
          <h2 className="text-base font-semibold text-white">
            Nova Campanha de Envio
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Título da Campanha *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Promoção de Black Friday"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-700/50 focus:border-blue-500 outline-none text-white placeholder-slate-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Canal de Conexão *
                </label>
                <select
                  value={selectedConnectionId}
                  onChange={(e) => setSelectedConnectionId(e.target.value)}
                  className="w-full bg-slate-900 px-4 py-3 rounded-xl border border-slate-700/50 focus:border-blue-500 outline-none text-white text-sm"
                >
                  {connections.length === 0 ? (
                    <option value="">Nenhum canal cadastrado</option>
                  ) : (
                    connections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""} -{" "}
                        {c.status === "connected" ? "Ativo" : "Desconectado"}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Mensagem *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Digite o texto que será enviado aos contatos..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-700/50 focus:border-blue-500 outline-none text-white placeholder-slate-500 text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Momento do Envio
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSendOption("now")}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      sendOption === "now"
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-slate-900/50 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    ⚡ Disparar Agora
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendOption("schedule")}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      sendOption === "schedule"
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-slate-900/50 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    📅 Agendar
                  </button>
                </div>
              </div>

              {sendOption === "schedule" && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Data e Hora do Agendamento *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-700 focus:border-blue-500 outline-none text-white text-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-400">
                Destinatários:{" "}
                <strong className="text-white">
                  {contacts.length} contatos
                </strong>
              </span>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20"
              >
                {submitting
                  ? "Processando..."
                  : sendOption === "now"
                    ? "Confirmar Disparo"
                    : "Salvar Agendamento"}
              </button>
            </div>
          </form>
        </div>

        {/* Histórico / Lista de Envios */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50">
            <h2 className="font-semibold text-slate-200">
              Histórico de Disparos
            </h2>
            <span className="bg-slate-900 text-slate-400 py-1 px-3 rounded-full text-xs font-medium border border-slate-700">
              {broadcasts.length} registros
            </span>
          </div>

          {loading || authLoading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Carregando históricos...
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-sm">
              Nenhuma campanha ou agendamento registrado ainda.
            </div>
          ) : (
            <ul className="divide-y divide-slate-700/50">
              {broadcasts.map((b) => {
                const isSent = b.status === "sent";
                return (
                  <li
                    key={b.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-700/20 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white text-base">
                          {b.title}
                        </h3>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                            isSent
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {isSent ? "Enviado" : "Agendado"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 max-w-xl">
                        {b.message}
                      </p>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-1">
                        <span>Canal: {b.connectionName}</span>
                        <span>•</span>
                        <span>Destinatários: {b.recipientCount}</span>
                        <span>•</span>
                        <span>
                          Data:{" "}
                          {new Date(b.scheduledAt).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setBroadcastToDelete(b)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors self-end sm:self-auto"
                      title="Excluir Registro"
                    >
                      🗑️
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {broadcastToDelete && (
        <ConfirmationModal
          title="Excluir Registro"
          message={`Tem certeza que deseja excluir a campanha "${broadcastToDelete.title}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setBroadcastToDelete(null)}
        />
      )}
    </div>
  );
}
