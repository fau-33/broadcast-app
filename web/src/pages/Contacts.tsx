import { useState, useEffect, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ConfirmationModal } from "../components/ConfirmationModal";
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
} from "../services/contactService";
import type { Contact } from "../types/contact";

export function Contacts() {
  const { user, loading: authLoading } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [search, setSearch] = useState("");

  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Busca inicial protegida contra vazamento de estado
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      void Promise.resolve().then(() => {
        setContacts([]);
        setLoading(false);
      });
      return;
    }

    let isMounted = true;

    const fetchContacts = async () => {
      try {
        const data = await getContacts(user.uid);
        if (isMounted) {
          setContacts(data);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError("Falha ao carregar lista de contatos.");
        }
        console.error(err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchContacts();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  // Salvar / Editar Contato
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName || !trimmedPhone || submitting || !user) return;

    setSubmitting(true);
    setError("");

    try {
      if (editingContact) {
        await updateContact(editingContact.id, {
          name: trimmedName,
          phone: trimmedPhone,
          email: email.trim() || undefined,
        });
        setContacts((prev) =>
          prev.map((c) =>
            c.id === editingContact.id
              ? {
                  ...c,
                  name: trimmedName,
                  phone: trimmedPhone,
                  email: email.trim(),
                }
              : c,
          ),
        );
        setEditingContact(null);
      } else {
        const newId = await createContact({
          name: trimmedName,
          phone: trimmedPhone,
          email: email.trim() || undefined,
          userId: user.uid,
        });
        const newContact: Contact = {
          id: typeof newId === "string" ? newId : Date.now().toString(),
          name: trimmedName,
          phone: trimmedPhone,
          email: email.trim() || undefined,
          userId: user.uid,
          createdAt: new Date().toISOString(),
        };
        setContacts((prev) => [newContact, ...prev]);
      }
      setName("");
      setPhone("");
      setEmail("");
    } catch (err) {
      console.error("Erro ao salvar contato:", err);
      setError("Não foi possível salvar o contato.");
    } finally {
      setSubmitting(false);
    }
  };

  // Excluir Contato
  const confirmDelete = async () => {
    if (!contactToDelete) return;
    const targetId = contactToDelete.id;
    setContactToDelete(null);

    setContacts((prev) => prev.filter((c) => c.id !== targetId));

    try {
      await deleteContact(targetId);
    } catch (err) {
      console.error("Erro ao excluir contato:", err);
      setError("Falha ao excluir contato.");
    }
  };

  const startEditing = (contact: Contact) => {
    setEditingContact(contact);
    setName(contact.name);
    setPhone(contact.phone);
    setEmail(contact.email || "");
  };

  const cancelEditing = () => {
    setEditingContact(null);
    setName("");
    setPhone("");
    setEmail("");
    setError("");
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())),
  );

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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Lista de Contatos
          </h1>
          <p className="text-slate-400">
            Cadastre e estruture sua base de destinatários para transmissões de
            mensagens.
          </p>
        </header>

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Formulário de Cadastro */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 rounded-2xl shadow-lg space-y-3">
          <h2 className="text-sm font-semibold text-slate-300">
            {editingContact ? "Editar Contato" : "Novo Contato"}
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            <input
              type="text"
              required
              placeholder="Nome *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-700/50 focus:border-blue-500 outline-none text-white placeholder-slate-500 text-sm"
            />
            <input
              type="text"
              required
              placeholder="Telefone (WhatsApp) *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-700/50 focus:border-blue-500 outline-none text-white placeholder-slate-500 text-sm"
            />
            <input
              type="email"
              placeholder="E-mail (opcional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-700/50 focus:border-blue-500 outline-none text-white placeholder-slate-500 text-sm"
            />

            <div className="md:col-span-3 flex justify-end gap-2 pt-1">
              {editingContact && (
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl text-sm transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20"
              >
                {submitting
                  ? "Salvando..."
                  : editingContact
                    ? "Atualizar Contato"
                    : "Salvar Contato"}
              </button>
            </div>
          </form>
        </div>

        {/* Lista e Campo de Busca */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl space-y-0">
          <div className="px-6 py-4 border-b border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-800/50">
            <h2 className="font-semibold text-slate-200">
              Contatos Registrados ({filteredContacts.length})
            </h2>
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-700 outline-none text-white placeholder-slate-500 text-xs focus:border-blue-500"
            />
          </div>

          {loading || authLoading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Carregando contatos...
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-sm">
              {search
                ? "Nenhum contato encontrado na busca."
                : "Nenhum contato cadastrado ainda."}
            </div>
          ) : (
            <ul className="divide-y divide-slate-700/50">
              {filteredContacts.map((contact) => (
                <li
                  key={contact.id}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-700/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-white text-base">
                        {contact.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span>📱 {contact.phone}</span>
                        {contact.email && <span>✉️ {contact.email}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEditing(contact)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setContactToDelete(contact)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modal de Exclusão */}
      {contactToDelete && (
        <ConfirmationModal
          title="Excluir Contato"
          message={`Tem certeza que deseja excluir o contato "${contactToDelete.name}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setContactToDelete(null)}
        />
      )}
    </div>
  );
}
