export function getItem<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function setItem<T>(key: string, data: T[]): void {
  const serialized = JSON.stringify(data);
  localStorage.setItem(key, serialized);
  const verify = localStorage.getItem(key);
  if (verify !== serialized) {
    throw new Error(
      `[localStorage] Fallo al guardar ${key}: los datos no persistieron (posible cuota excedida)`
    );
  }
}

export function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
