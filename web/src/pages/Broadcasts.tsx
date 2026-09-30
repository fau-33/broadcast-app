import { useState, useEffect, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { getConnections } from "../services/connectionService";
import { getContacts } from "../services/contactService";
import {
  getBroadcasts,
  createBroadcast,
  updateBroadcast,
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

  // Filtro do Histórico ("all" | "sent" | "scheduled")
  const [historyFilter, setHistoryFilter] = useState<
    "all" | "sent" | "scheduled"
  >("all");

  // Formulário (Criação/Edição)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [sendOption, setSendOption] = useState<"now" | "schedule">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectAllContacts, setSelectAllContacts] = useState(true);

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

          // Seleciona todos os contatos por padrão
          setSelectedContactIds(loadedContacts.map((c) => c.id));

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

  // Gerencia seleção de contatos individual ou em massa
  const handleToggleSelectAll = (checked: boolean) => {
    setSelectAllContacts(checked);
    if (checked) {
      setSelectedContactIds(contacts.map((c) => c.id));
    } else {
      setSelectedContactIds([]);
    }
  };

  const handleToggleContact = (contactId: string) => {
    setSelectedContactIds((prev) => {
      const exists = prev.includes(contactId);
      let updated: string[];
      if (exists) {
        updated = prev.filter((id) => id !== contactId);
      } else {
        updated = [...prev, contactId];
      }
      setSelectAllContacts(updated.length === contacts.length);
      return updated;
    });
  };

  const handleEditBroadcast = (b: Broadcast) => {
    setEditingId(b.id);
    setTitle(b.title);
    setMessage(b.message);
    setSelectedConnectionId(b.connectionId);
    setSelectedContactIds(b.recipientIds || []);
    setSelectAllContacts(
      b.recipientIds ? b.recipientIds.length === contacts.length : true,
    );

    if (b.status === "scheduled" && b.scheduledAt) {
      setSendOption("schedule");
      const d = new Date(b.scheduledAt);
      if (!isNaN(d.getTime())) {
        const tzOffset = d.getTimezoneOffset() * 60000;
        const localISOTime = new Date(d.getTime() - tzOffset)
          .toISOString()
          .slice(0, 16);
        setScheduledDate(localISOTime);
      } else {
        setScheduledDate("");
      }
    } else {
      setSendOption("now");
      setScheduledDate("");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setMessage("");
    setScheduledDate("");
    setSelectedContactIds(contacts.map((c) => c.id));
    setSelectAllContacts(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim() || !message.trim() || !selectedConnectionId || !user) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (selectedContactIds.length === 0) {
      setError("Selecione pelo menos 1 contato destinatário.");
      return;
    }

    const conn = connections.find((c) => c.id === selectedConnectionId);
    if (!conn) {
      setError("Selecione um canal válido.");
      return;
    }

    const isImmediate = sendOption === "now";
    let scheduledAtIso = new Date().toISOString();

    if (!isImmediate) {
      if (!scheduledDate) {
        setError("Selecione a data e hora para o agendamento.");
        return;
      }

      const [datePart, timePart] = scheduledDate.split("T");
      if (!datePart || !timePart) {
        setError("Data e hora de agendamento inválidas.");
        return;
      }

      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute] = timePart.split(":").map(Number);

      const parsedDate = new Date(year, month - 1, day, hour, minute, 0);

      if (isNaN(parsedDate.getTime())) {
        setError("Data e hora de agendamento inválidas.");
        return;
      }

      scheduledAtIso = parsedDate.toISOString();
    }

    setSubmitting(true);
    const status: "sent" | "scheduled" = isImmediate ? "sent" : "scheduled";

    try {
      if (editingId) {
        const updatePayload: Partial<Broadcast> = {
          title: title.trim(),
          message: message.trim(),
          connectionId: conn.id,
          connectionName: conn.name,
          recipientIds: selectedContactIds,
          recipientCount: selectedContactIds.length,
          status,
          scheduledAt: scheduledAtIso,
          ...(isImmediate ? { sentAt: new Date().toISOString() } : {}),
        };

        await updateBroadcast(editingId, updatePayload);

        setBroadcasts((prev) =>
          prev.map((b) =>
            b.id === editingId ? { ...b, ...updatePayload } : b,
          ),
        );
        setSuccess("Campanha atualizada com sucesso!");
        setEditingId(null);
      } else {
        const payload: Omit<Broadcast, "id" | "createdAt"> = {
          title: title.trim(),
          message: message.trim(),
          connectionId: conn.id,
          connectionName: conn.name,
          recipientsType:
            selectedContactIds.length === contacts.length ? "all" : "selected",
          recipientIds: selectedContactIds,
          recipientCount: selectedContactIds.length,
          status,
          scheduledAt: scheduledAtIso,
          userId: user.uid,
          ...(isImmediate ? { sentAt: new Date().toISOString() } : {}),
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
      }

      setTitle("");
      setMessage("");
      setScheduledDate("");
      setSelectedContactIds(contacts.map((c) => c.id));
      setSelectAllContacts(true);
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar disparo. Verifique a conexão com o banco.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!broadcastToDelete) return;
    const targetId = broadcastToDelete.id;
    if (editingId === targetId) cancelEdit();
    setBroadcastToDelete(null);

    setBroadcasts((prev) => prev.filter((b) => b.id !== targetId));

    try {
      await deleteBroadcast(targetId);
    } catch (err) {
      console.error(err);
      setError("Erro ao excluir registro de disparo.");
    }
  };

  // Filtragem do histórico
  const filteredBroadcasts = broadcasts.filter((b) => {
    if (historyFilter === "sent") return b.status === "sent";
    if (historyFilter === "scheduled") return b.status === "scheduled";
    return true;
  });

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
            Crie campanhas, selecione o canal, escolha os destinatários e envie
            mensagens instantâneas ou agendadas.
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

        {/* Formulário de Novo Disparo / Edição */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-semibold text-white">
              {editingId
                ? "Editar Campanha / Agendamento"
                : "Nova Campanha de Envio"}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Cancelar Edição
              </button>
            )}
          </div>

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

            {/* Seletor de Contatos Destinatários */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/40 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-300">
                  Selecionar Destinatários ({selectedContactIds.length} de{" "}
                  {contacts.length} selecionados) *
                </span>
                <label className="flex items-center gap-2 text-xs text-blue-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectAllContacts}
                    onChange={(e) => handleToggleSelectAll(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                  />
                  Selecionar Todos
                </label>
              </div>

              {contacts.length === 0 ? (
                <p className="text-xs text-amber-400">
                  Você não possui contatos cadastrados. Cadastre contatos
                  primeiro.
                </p>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1 pr-2 divide-y divide-slate-800/50">
                  {contacts.map((ct) => {
                    const isChecked = selectedContactIds.includes(ct.id);
                    return (
                      <div
                        key={ct.id}
                        className="pt-2 flex items-center justify-between text-xs"
                      >
                        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleContact(ct.id)}
                            className="rounded border-slate-700 bg-slate-900 text-blue-600"
                          />
                          <span className="font-medium text-white">
                            {ct.name}
                          </span>
                          <span className="text-slate-500">({ct.phone})</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
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
                Total Selecionado:{" "}
                <strong className="text-white">
                  {selectedContactIds.length} contatos
                </strong>
              </span>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20"
              >
                {submitting
                  ? "Processando..."
                  : editingId
                    ? "Salvar Alterações"
                    : sendOption === "now"
                      ? "Confirmar Disparo"
                      : "Salvar Agendamento"}
              </button>
            </div>
          </form>
        </div>

        {/* Histórico / Lista de Envios com Filtros */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-800/50">
            <h2 className="font-semibold text-slate-200">
              Histórico de Disparos
            </h2>

            {/* Botões de Filtro */}
            <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setHistoryFilter("all")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  historyFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setHistoryFilter("sent")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  historyFilter === "sent"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Enviadas
              </button>
              <button
                onClick={() => setHistoryFilter("scheduled")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  historyFilter === "scheduled"
                    ? "bg-amber-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Agendadas
              </button>
            </div>
          </div>

          {loading || authLoading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Carregando históricos...
            </div>
          ) : filteredBroadcasts.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-sm">
              Nenhuma campanha encontrada para este filtro.
            </div>
          ) : (
            <ul className="divide-y divide-slate-700/50">
              {filteredBroadcasts.map((b) => {
                const isSent = b.status === "sent";
                const formattedDate = b.scheduledAt
                  ? !isNaN(new Date(b.scheduledAt).getTime())
                    ? new Date(b.scheduledAt).toLocaleString("pt-BR")
                    : "Data inválida"
                  : "Não agendado";

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
                          {isSent ? "Enviada" : "Agendada"}
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
                        <span>Data: {formattedDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleEditBroadcast(b)}
                        className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium transition-colors"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => setBroadcastToDelete(b)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                        title="Excluir Registro"
                      >
                        🗑️
                      </button>
                    </div>
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
