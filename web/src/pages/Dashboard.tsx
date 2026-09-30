import { signOut } from "firebase/auth";
import { Link } from "react-router-dom";
import { auth } from "../config/firebase";
import { useAuth } from "../hooks/useAuth";

export function Dashboard() {
  const { user } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Topbar / Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">
            🚀
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">Broadcast App</h1>
            <span className="text-xs text-slate-400">
              Painel de Controle SaaS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400">Conectado como</p>
            <p className="text-sm font-medium text-slate-200">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Banner de Boas-vindas */}
        <div className="bg-gradient-to-r from-blue-900/40 to-slate-800 p-6 rounded-xl border border-blue-500/20">
          <h2 className="text-xl font-bold mb-1">Visão Geral da Conta</h2>
          <p className="text-sm text-slate-300">
            Gerencie suas conexões, lista de transmissão e agende mensagens de
            forma simplificada.
          </p>
        </div>

        {/* Métricas / KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Conexões Ativas
            </span>
            <p className="text-2xl font-bold text-white mt-2">0</p>
            <span className="text-xs text-slate-500 mt-1 block">
              Canais cadastrados
            </span>
          </div>

          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total de Contatos
            </span>
            <p className="text-2xl font-bold text-white mt-2">0</p>
            <span className="text-xs text-slate-500 mt-1 block">
              Destinatários salvos
            </span>
          </div>

          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Mensagens Agendadas
            </span>
            <p className="text-2xl font-bold text-amber-400 mt-2">0</p>
            <span className="text-xs text-slate-500 mt-1 block">
              Aguardando envio
            </span>
          </div>

          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Enviadas com Sucesso
            </span>
            <p className="text-2xl font-bold text-emerald-400 mt-2">0</p>
            <span className="text-xs text-slate-500 mt-1 block">
              Total disparado
            </span>
          </div>
        </div>

        {/* Módulos do Sistema */}
        <div>
          <h3 className="text-base font-semibold mb-4 text-slate-200">
            Módulos do Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Módulo Conexões */}
            <Link
              to="/connections"
              className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-colors flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="text-2xl mb-3">📱</div>
                <h4 className="font-semibold text-lg mb-1 group-hover:text-blue-400 transition-colors">
                  Conexões
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  Cadastre e gerencie as contas/números de envio de mensagens.
                </p>
              </div>
              <span className="text-xs font-semibold text-blue-400">
                Acessar Módulo →
              </span>
            </Link>

            {/* Módulo Contatos */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-colors flex flex-col justify-between">
              <div>
                <div className="text-2xl mb-3">👥</div>
                <h4 className="font-semibold text-lg mb-1">Contatos</h4>
                <p className="text-xs text-slate-400 mb-4">
                  Importe e estruture sua lista de contatos para transmissões.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Em breve →
              </span>
            </div>

            {/* Módulo Disparos */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-colors flex flex-col justify-between">
              <div>
                <div className="text-2xl mb-3">💬</div>
                <h4 className="font-semibold text-lg mb-1">
                  Disparos & Agendamentos
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  Crie textos, escolha os destinatários e agende os envios.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Em breve →
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
