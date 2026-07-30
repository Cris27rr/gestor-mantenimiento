import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { User, UserRole } from "@/types";
import { localAuth, userFromSession } from "@/lib/auth/localAuthFallback";
import { clearSessionToken } from "@/lib/auth/sessionStore";
import { recordAccessLog } from "@/lib/audit/localAuditLogs";
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

function toSafeUser(found: User): User {
  return {
    id: found.id,
    nombre: found.nombre,
    email: found.email,
    rol: found.rol,
    avatar: found.avatar,
    createdAt: found.createdAt,
  };
}

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
          const safeUser = toSafeUser(fresh);
          setUser(safeUser);
          localStorage.setItem("medimaint_user", JSON.stringify(safeUser));
        }
      }
    } catch {
      // ignore refresh errors
    }
  }, [user]);

  useEffect(() => {
    const session = localAuth.verifySession();
    if (session?.userId) {
      const found = localAuth.getUserById(session.userId);
      const safeUser = found ? toSafeUser(found) : userFromSession(session);
      setUser(safeUser);
      setIsDemoSession(session.isDemo === true);
      setIsLoading(false);
      return;
    }

    const stored = localStorage.getItem("medimaint_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored) as User);
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
          const safeUser = toSafeUser(found);
          setUser(safeUser);
          setIsDemoSession(false);
          localStorage.setItem("medimaint_user", JSON.stringify(safeUser));
          return { ok: true };
        }
        return { ok: false, reason: "Credenciales incorrectas o servicio no disponible" };
      }

      const result = localAuth.verifyPassword(email, password);
      if (result.user) {
        const safeUser = toSafeUser(result.user);
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
      const { user: demoUser } = localAuth.loginDemo();
      const safeUser = toSafeUser({
        ...demoUser,
        createdAt: demoUser.createdAt ?? new Date().toISOString(),
      });
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
      recordAccessLog(user.id, user.email, "logout", "Logout");
    }
    setUser(null);
    setIsDemoSession(false);
    localStorage.removeItem("medimaint_user");
    clearSessionToken();
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
