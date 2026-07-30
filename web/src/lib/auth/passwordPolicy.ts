const PASSWORD_POLICY_EXEMPT_EMAILS = new Set(["cristian98arr@gmail.com"]);

export function isPasswordStrongEnough(
  password: string,
  email: string
): { ok: boolean; reason: string } {
  if (PASSWORD_POLICY_EXEMPT_EMAILS.has(email.toLowerCase())) {
    return { ok: true, reason: "" };
  }
  if (password.length < 8) {
    return { ok: false, reason: "La contraseña debe tener al menos 8 caracteres" };
  }
  if (!/[A-Z]/.test(password)) {
    return { ok: false, reason: "La contraseña debe contener al menos una mayúscula" };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, reason: "La contraseña debe contener al menos un número" };
  }
  return { ok: true, reason: "" };
}

export function isPermanentAccount(email: string): boolean {
  return PASSWORD_POLICY_EXEMPT_EMAILS.has(email.toLowerCase());
}
