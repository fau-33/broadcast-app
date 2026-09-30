import { useState, useEffect, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { QRCodeModal } from "../components/QRCodeModal";
import { ConfirmationModal } from "../components/ConfirmationModal";
import {
  getConnections,
  createConnection,
  updateConnection,
  deleteConnection,
  updateConnectionStatus,
} from "../services/connectionService";
import type { Connection } from "../types/connection";

export function Connections() {
  const { user, loading: authLoading } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [name, setName] = useState("");
  const [editingConnection, setEditingConnection] = useState<Connection | null>(
    null,
  );
  const [selectedForQR, setSelectedForQR] = useState<Connection | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [connectionToDelete, setConnectionToDelete] =
    useState<Connection | null>(null);

  // Busca inicial de dados sem causar renderizações síncronas em cascata
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      void Promise.resolve().then(() => {
        setConnections([]);
        setLoading(false);
      });
      return;
    }

    let isMounted = true;

    const fetchConnections = async () => {
      try {
        const data = await getConnections(user.uid);
        if (isMounted) {
          setConnections(data);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError("Falha ao carregar conexões. Verifique sua internet.");
        }
        console.error(err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchConnections();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  // Ação de Salvar / Atualizar
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || submitting || !user) return;

    setSubmitting(true);
    setError("");

    try {
      if (editingConnection) {
        // 1. Atualiza no banco
        await updateConnection(editingConnection.id, trimmedName);
        // 2. Atualiza na tela (Otimista)
        setConnections((prev) =>
          prev.map((c) =>
            c.id === editingConnection.id ? { ...c, name: trimmedName } : c,
          ),
        );
        setEditingConnection(null);
      } else {
        // 1. Salva no banco
        const newId = await createConnection(trimmedName, user.uid);
        // 2. Cria na tela (Otimista)
        const newConn: Connection = {
          id: typeof newId === "string" ? newId : Date.now().toString(),
          name: trimmedName,
          status: "disconnected",
          userId: user.uid,
          createdAt: new Date().toISOString(),
        };
        setConnections((prev) => [newConn, ...prev]);
      }
      setName("");
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setError("Não foi possível salvar a conexão.");
    } finally {
      setSubmitting(false);
    }
  };

  // Ação de Conectar / Desconectar
  const handleConnectStatus = async (
    connId: string,
    status: "connected" | "disconnected",
  ) => {
    setConnections((prev) =>
      prev.map((c) => (c.id === connId ? { ...c, status } : c)),
    );

    try {
      await updateConnectionStatus(connId, status);
    } catch (err) {
      console.error("Erro ao alterar status:", err);
      setError("Erro ao sincronizar status com o servidor.");
      const revertStatus =
        status === "connected" ? "disconnected" : "connected";
      setConnections((prev) =>
        prev.map((c) => (c.id === connId ? { ...c, status: revertStatus } : c)),
      );
    }
  };

  // Ação de Excluir
  const handleDelete = (conn: Connection) => {
    setConnectionToDelete(conn);
  };

  const confirmDelete = async () => {
    if (!connectionToDelete) return;

    const id = connectionToDelete.id;
    setConnectionToDelete(null);

    setConnections((prev) => prev.filter((c) => c.id !== id));

    try {
      await deleteConnection(id);
    } catch (err) {
      console.error("Erro ao excluir:", err);
      setError("Falha ao excluir a conexão. Atualize a página.");
    }
  };

  // Funções de UI Auxiliares
  const startEditing = (conn: Connection) => {
    setEditingConnection(conn);
    setName(conn.name);
  };

  const cancelEditing = () => {
    setEditingConnection(null);
    setName("");
    setError("");
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
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            Canais de Conexão
          </h1>
          <p className="text-slate-400">
            Gerencie seus números de WhatsApp e canais de envio de forma
            centralizada.
          </p>
        </header>

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-fade-in">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Formulário */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-1.5 rounded-2xl shadow-lg">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input
              type="text"
              required
              placeholder="Ex: WhatsApp Suporte VIP..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-slate-900/50 px-5 py-3.5 rounded-xl border border-transparent focus:border-blue-500/50 focus:bg-slate-900 outline-none text-white placeholder-slate-500 transition-all"
            />

            <div className="flex gap-2">
              {editingConnection && (
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-5 py-3.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                >
                  Cancelar
                </button>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex-1 sm:flex-none px-6 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 min-w-[140px]"
              >
                {submitting ? (
                  <svg
                    className="animate-spin w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : editingConnection ? (
                  <>Atualizar</>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Adicionar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de Conexões */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50">
            <h2 className="font-semibold text-slate-200">
              Dispositivos Cadastrados
            </h2>
            <span className="bg-slate-900 text-slate-400 py-1 px-3 rounded-full text-xs font-medium border border-slate-700">
              {connections.length}{" "}
              {connections.length === 1 ? "conexão" : "conexões"}
            </span>
          </div>

          {loading || authLoading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <svg
                className="animate-spin w-8 h-8 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-slate-400 text-sm">Sincronizando dados...</p>
            </div>
          ) : connections.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-300 mb-1">
                Nenhuma conexão ativa
              </h3>
              <p className="text-slate-500 text-sm max-w-sm">
                Adicione um novo canal acima para começar a gerenciar seus
                envios.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-700/50">
              {connections.map((conn) => {
                const isConnected = conn.status === "connected";
                return (
                  <li
                    key={conn.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-700/20 transition-colors"
                  >
                    {/* Info da Conexão */}
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${isConnected ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-700 text-slate-400"}`}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-white text-base">
                          {conn.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="relative flex h-2.5 w-2.5">
                            {isConnected && (
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            )}
                            <span
                              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? "bg-emerald-500" : "bg-amber-500"}`}
                            ></span>
                          </span>
                          <span
                            className={`text-xs font-medium ${isConnected ? "text-emerald-400" : "text-amber-400"}`}
                          >
                            {isConnected
                              ? "Sessão Ativa"
                              : "Aguardando QR Code"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {!isConnected ? (
                        <button
                          onClick={() => setSelectedForQR(conn)}
                          className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
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
                              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                            />
                          </svg>
                          Conectar
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            handleConnectStatus(conn.id, "disconnected")
                          }
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
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
                              d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                          </svg>
                          Desconectar
                        </button>
                      )}

                      <button
                        onClick={() => startEditing(conn)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        title="Editar"
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
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(conn)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                        title="Excluir"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Modal de QR Code */}
      {selectedForQR && (
        <QRCodeModal
          connectionName={selectedForQR.name}
          onConnect={async () => {
            const id = selectedForQR.id;
            setSelectedForQR(null);
            if (id) await handleConnectStatus(id, "connected");
          }}
          onClose={() => setSelectedForQR(null)}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {connectionToDelete && (
        <ConfirmationModal
          title="Excluir Conexão"
          message={`Tem certeza que deseja excluir "${connectionToDelete.name}"? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="danger"
          onConfirm={confirmDelete}
          onCancel={() => setConnectionToDelete(null)}
        />
      )}
    </div>
  );
}
