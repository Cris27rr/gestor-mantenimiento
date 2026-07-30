import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { User, UserRole } from "@/types";
import { db } from "@/lib/mockDb";
import { isSupabaseConfigured } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; locked?: boolean; reason?: string }>;
  loginDemo: () => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasRole: (roles: UserRole[]) => boolean;
  refreshUser: () => Promise<void>;
  isDemoSession: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoSession, setIsDemoSession] = useState(false);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      if (isSupabaseConfigured) {
        const fresh = await (await import("@/lib/db")).db.usuarios.getById(user.id);
        if (fresh) {
          const safeUser: User = {
            id: fresh.id,
            nombre: fresh.nombre,
            email: fresh.email,
            rol: fresh.rol,
            avatar: fresh.avatar,
            createdAt: fresh.createdAt,
          };
          setUser(safeUser);
          localStorage.setItem("medimaint_user", JSON.stringify(safeUser));
        }
      }
    } catch {
      // ignore refresh errors
    }
  }, [user]);

  useEffect(() => {
    // Try session token first
    const session = db.usuarios.verifySession();
    if (session && session.userId) {
      const usuarios = db.usuarios.getAll();
      const found = usuarios.find((u) => u.id === session.userId);
      if (found) {
        const safeUser: User = {
          id: found.id,
          nombre: found.nombre,
          email: found.email,
          rol: found.rol,
          avatar: found.avatar,
          createdAt: found.createdAt,
        };
        setUser(safeUser);
        setIsDemoSession(session.isDemo === true);
        setIsLoading(false);
        return;
      }
    }

    // Fallback to stored user in localStorage
    const stored = localStorage.getItem("medimaint_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);
      } catch {
        localStorage.removeItem("medimaint_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ ok: boolean; locked?: boolean; reason?: string }> => {
    try {
      if (isSupabaseConfigured) {
        const found = await (await import("@/lib/db")).db.usuarios.verifyPassword(email, password);
        if (found) {
          const safeUser: User = {
            id: found.id,
            nombre: found.nombre,
            email: found.email,
            rol: found.rol,
            avatar: found.avatar,
            createdAt: found.createdAt,
          };
          setUser(safeUser);
          setIsDemoSession(false);
          localStorage.setItem("medimaint_user", JSON.stringify(safeUser));
          return { ok: true };
        }
        return { ok: false, reason: "Credenciales incorrectas o servicio no disponible" };
      }

      // Use mockDb
      const result = db.usuarios.verifyPassword(email, password);
      if (result.user) {
        const safeUser: User = {
          id: result.user.id,
          nombre: result.user.nombre,
          email: result.user.email,
          rol: result.user.rol,
          avatar: result.user.avatar,
          createdAt: result.user.createdAt,
        };
        setUser(safeUser);
        setIsDemoSession(false);
        localStorage.setItem("medimaint_user", JSON.stringify(safeUser));
        return { ok: true };
      }
      if (result.locked) {
        return { ok: false, locked: true, reason: result.reason };
      }
      return { ok: false, reason: result.reason };
    } catch (err) {
      console.error("Login error:", err);
      return { ok: false, reason: "Error al conectar con el servidor" };
    }
  }, []);

  const loginDemo = useCallback(async (): Promise<boolean> => {
    try {
      const { user: demoUser } = db.usuarios.loginDemo();
      const safeUser: User = {
        id: demoUser.id,
        nombre: demoUser.nombre,
        email: demoUser.email,
        rol: demoUser.rol,
        createdAt: demoUser.createdAt ?? new Date().toISOString(),
      };
      setUser(safeUser);
      setIsDemoSession(true);
      localStorage.setItem("medimaint_user", JSON.stringify(safeUser));
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    if (user) {
      // Log access on logout using mockDb
      try {
        const { accessLog } = require("@/lib/mockDb");
        // Fire-and-forget: we can't import accessLog directly since it's not exported
      } catch { /* ignore */ }
    }
    setUser(null);
    setIsDemoSession(false);
    localStorage.removeItem("medimaint_user");
    localStorage.removeItem("medimaint_session_token");
  }, [user]);

  const hasRole = useCallback(
    (roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.rol);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, login, loginDemo, logout, isLoading, hasRole, refreshUser, isDemoSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
