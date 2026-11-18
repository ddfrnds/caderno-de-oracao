import { createUser } from '../src/server/users';

export const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
export const PDF = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

export function file(data: Buffer | string, name: string): File {
  return new File([typeof data === 'string' ? Buffer.from(data) : new Uint8Array(data)], name);
}

export async function makeUser(over: Partial<{ name: string; email: string; role: 'user' | 'admin' }> = {}) {
  return createUser({
    name: over.name ?? 'Maria Silva',
    email: over.email ?? `u${Math.random().toString(36).slice(2)}@exemplo.com`,
    password: 'senha-segura-123',
    role: over.role,
  });
}
