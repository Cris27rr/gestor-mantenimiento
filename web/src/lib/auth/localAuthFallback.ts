import type { User, UserRole } from "@/types";
import { getItem, setItem } from "@/lib/auth/storageUtils";
import { isPasswordStrongEnough, isPermanentAccount } from "@/lib/auth/passwordPolicy";
import { recordAccessLog, recordAuditLog } from "@/lib/audit/localAuditLogs";
import {
  signSessionToken,
  verifySessionToken,
  type VerifiedSession,
} from "@/lib/auth/sessionStore";

const USERS_KEY = "medimaint_usuarios";

const PERMANENT_ACCOUNTS: User[] = [
  {
    id: "cristian98arr",
    nombre: "Cristian Administrador",
    email: "cristian98arr@gmail.com",
    passwordHash: "123456",
    rol: "admin",
    createdAt: "2025-01-01T00:00:00.000Z",
  },
];

const DEMO_USER: User = {
  id: "demo-tecnico",
  nombre: "Técnico Demo",
  email: "demo@medimaint.internal",
  passwordHash: "",
  rol: "tecnico",
  createdAt: new Date().toISOString(),
};

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

function seedMinimalUsers(): void {
  const existing = getItem<User>(USERS_KEY);

  for (const perm of PERMANENT_ACCOUNTS) {
    const idx = existing.findIndex((u) => u.email.toLowerCase() === perm.email.toLowerCase());
    if (idx >= 0) {
      existing[idx] = {
        ...existing[idx],
        ...perm,
        passwordHash: existing[idx].passwordHash || perm.passwordHash,
        rol: perm.rol,
      };
    } else {
      existing.push(perm);
    }
  }

  const demoIdx = existing.findIndex((u) => u.id === DEMO_USER.id);
  if (demoIdx >= 0) {
    existing[demoIdx] = { ...DEMO_USER, createdAt: existing[demoIdx].createdAt };
  } else {
    existing.push(DEMO_USER);
  }

  setItem(USERS_KEY, existing);
}

seedMinimalUsers();

function getAllUsers(): User[] {
  return getItem<User>(USERS_KEY);
}

function saveUsers(users: User[]): void {
  setItem(USERS_KEY, users);
}

export const localAuth = {
  verifySession: (): VerifiedSession | null => verifySessionToken(),

  getAllUsers,

  getUserById: (id: string): User | undefined => getAllUsers().find((u) => u.id === id),

  verifyPassword: (
    email: string,
    password: string
  ): { user: User | undefined; locked: boolean; reason: string } => {
    const user = getAllUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { user: undefined, locked: false, reason: "Credenciales incorrectas" };

    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
      const remaining = Math.ceil(
        (new Date(user.lockedUntil).getTime() - Date.now()) / 60000
      );
      return {
        user: undefined,
        locked: true,
        reason: `Cuenta bloqueada. Intente nuevamente en ${remaining} minuto(s)`,
      };
    }

    if (user.passwordHash !== password) {
      const newAttempts = (user.failedAttempts ?? 0) + 1;
      const updates: Partial<User> = { failedAttempts: newAttempts };
      if (newAttempts >= MAX_FAILED_ATTEMPTS && !isPermanentAccount(user.email)) {
        updates.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
      }
      const all = getAllUsers();
      const idx = all.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        all[idx] = { ...all[idx], ...updates };
        saveUsers(all);
      }
      recordAccessLog(user.id, user.email, "login_failed", `Attempt ${newAttempts}`);
      return { user: undefined, locked: false, reason: "Credenciales incorrectas" };
    }

    if (user.failedAttempts && user.failedAttempts > 0) {
      const all = getAllUsers();
      const idx = all.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        all[idx] = { ...all[idx], failedAttempts: 0, lockedUntil: undefined };
        saveUsers(all);
      }
    }

    recordAccessLog(user.id, user.email, "login", "Login exitoso");
    signSessionToken(user, false);
    return { user: { ...user, failedAttempts: 0 }, locked: false, reason: "" };
  },

  loginDemo: (): { user: User; token: string } => {
    const demoUser = getAllUsers().find((u) => u.id === DEMO_USER.id) ?? DEMO_USER;
    recordAccessLog(demoUser.id, demoUser.email, "demo_login", "Acceso Demo");
    const token = signSessionToken(demoUser, true);
    return { user: demoUser, token };
  },

  changePassword: (
    userId: string,
    currentPassword: string,
    newPassword: string
  ): { ok: boolean; reason: string } => {
    const all = getAllUsers();
    const idx = all.findIndex((u) => u.id === userId);
    if (idx < 0) return { ok: false, reason: "Usuario no encontrado" };
    const user = all[idx];
    if (user.passwordHash !== currentPassword) {
      return { ok: false, reason: "Contraseña actual incorrecta" };
    }
    const policy = isPasswordStrongEnough(newPassword, user.email);
    if (!policy.ok) return policy;
    all[idx] = {
      ...user,
      passwordHash: newPassword,
      passwordChangedAt: new Date().toISOString(),
    };
    saveUsers(all);
    recordAuditLog(user.id, user.email, "change_password", "usuario", user.id, null, null);
    return { ok: true, reason: "" };
  },

  isPasswordStrongEnough,
  isPermanentAccount,
  getPermanentAccounts: (): User[] => PERMANENT_ACCOUNTS,
};

export function userFromSession(session: VerifiedSession): User {
  return {
    id: session.userId,
    nombre: session.nombre,
    email: session.email,
    rol: session.rol as UserRole,
    createdAt: new Date().toISOString(),
  };
}
