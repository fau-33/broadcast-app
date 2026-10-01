import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { useAuth } from "../hooks/useAuth";

/**
 * Componente de autenticação (Login e Registro)
 *
 * Responsabilidades:
 * - Gerenciar o estado de alternância entre telas de login e registro
 * - Validar credenciais e fazer autenticação via Firebase Auth
 * - Redirecionar usuários autenticados para a dashboard
 * - Exibir mensagens de erro claras e amigáveis ao usuário
 *
 * Fluxo:
 * 1. Registro: Cria conta → Faz logout automático → Redireciona para login
 * 2. Login: Valida credenciais → Se OK, redireciona para dashboard
 */
export function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();
  const { user } = useAuth();

  /**
   * Hook: Redireciona usuários já autenticados para a dashboard
   * Útil para evitar acesso à página de login após login bem-sucedido
   */
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  /**
   * Manipula o envio do formulário de login ou registro
   *
   * @param e - Evento do formulário
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      if (isRegister) {
        // Fluxo de REGISTRO
        await createUserWithEmailAndPassword(auth, email, password);

        // Faz logout imediato após criar conta (força novo login)
        await signOut(auth);

        // Mensagem de sucesso e alternância para tela de login
        setSuccessMessage(
          "✓ Conta criada com sucesso! Faça login para continuar.",
        );
        setEmail("");
        setPassword("");
        setIsRegister(false);
      } else {
        // Fluxo de LOGIN
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/");
      }
    } catch (err: unknown) {
      console.error("Erro do Firebase:", err);

      const firebaseError = err as { code?: string; message?: string };
      if (
        firebaseError.code === "auth/invalid-credential" ||
        firebaseError.code === "auth/wrong-password" ||
        firebaseError.code === "auth/user-not-found"
      ) {
        setError("E-mail ou senha incorretos.");
      } else if (firebaseError.code === "auth/email-already-in-use") {
        setError("Este e-mail já está em uso. Clique em 'Fazer Login'.");
      } else if (firebaseError.code === "auth/weak-password") {
        setError("A senha deve ter no mínimo 6 caracteres.");
      } else if (firebaseError.code === "auth/operation-not-allowed") {
        setError(
          "O login por E-mail/Senha precisa ser ativado no Firebase Console.",
        );
      } else {
        setError(
          `Erro (${firebaseError.code || "desconhecido"}): verifique o console.`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-700">
        {/* Cabeçalho da página */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🚀 Broadcast App</h1>
          <p className="text-slate-400 text-sm">
            {isRegister
              ? "Crie sua conta para começar"
              : "Faça login para acessar o sistema"}
          </p>
        </div>

        {/* Exibe mensagens de erro */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {/* Exibe mensagens de sucesso */}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 text-sm p-3 rounded-lg mb-6 text-center">
            {successMessage}
          </div>
        )}

        {/* Formulário de autenticação */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Senha
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {loading ? "Carregando..." : isRegister ? "Criar Conta" : "Entrar"}
          </button>
        </form>

        {/* Alternar entre Login e Registro */}
        <div className="mt-6 text-center text-xs text-slate-400">
          {isRegister ? "Já possui uma conta?" : "Ainda não tem conta?"}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
              setSuccessMessage("");
            }}
            className="ml-1 text-blue-400 hover:underline font-semibold cursor-pointer"
          >
            {isRegister ? "Fazer Login" : "Cadastre-se"}
          </button>
        </div>
      </div>
    </div>
  );
}
