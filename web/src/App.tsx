import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Connections } from "./pages/Connections";
import { Contacts } from "./pages/Contacts";
import "./index.css";

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : children;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/connections"
            element={
              <PrivateRoute>
                <Connections />
              </PrivateRoute>
            }
          />
          <Route
            path="/contacts"
            element={
              <PrivateRoute>
                <Contacts />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
