import type { User } from "@/types";

export const DEMO_SESSION_DURATION_MS = 30 * 60 * 1000;
const SESSION_KEY = "medimaint_session_token";
const DEFAULT_SESSION_MS = 24 * 60 * 60 * 1000;

export interface VerifiedSession {
  userId: string;
  email: string;
  rol: string;
  nombre: string;
  isDemo: boolean;
}

export function signSessionToken(user: User, isDemo: boolean): string {
  const payload = {
    userId: user.id,
    email: user.email,
    rol: user.rol,
    nombre: user.nombre,
    exp: Date.now() + (isDemo ? DEMO_SESSION_DURATION_MS : DEFAULT_SESSION_MS),
    iat: Date.now(),
    isDemo,
  };
  const token = btoa(JSON.stringify(payload));
  localStorage.setItem(SESSION_KEY, token);
  return token;
}

export function verifySessionToken(): VerifiedSession | null {
  try {
    const token = localStorage.getItem(SESSION_KEY);
    if (!token) return null;
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return {
      userId: payload.userId,
      email: payload.email,
      rol: payload.rol,
      nombre: payload.nombre,
      isDemo: payload.isDemo === true,
    };
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearSessionToken(): void {
  localStorage.removeItem(SESSION_KEY);
}
