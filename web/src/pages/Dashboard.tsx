import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { useAuth } from "../hooks/useAuth";

export function Dashboard() {
  const { user } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto flex justify-between items-center border-b border-slate-800 pb-4 mb-8">
        <h1 className="text-2xl font-bold">🚀 Broadcast App - Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Sair
          </button>
        </div>
      </div>
      <p className="text-slate-300">Bem-vindo ao sistema!</p>
    </div>
  );
}
