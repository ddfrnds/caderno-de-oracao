/** Aceita apenas caminhos internos (evita open redirect). */
export function safeNext(raw: unknown, fallback = '/'): string {
  if (typeof raw !== 'string') return fallback;
  if (raw.length === 0 || raw.length > 200) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
  if (/[\r\n\t\\]/.test(raw)) return fallback;
  return raw;
}
