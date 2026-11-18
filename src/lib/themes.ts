export const FONTS = {
  cormorant: { label: 'Cormorant Garamond (clássica)', family: "'Cormorant Garamond', Georgia, serif", size: '1.3rem' },
  garamond: { label: 'EB Garamond (livro antigo)', family: "'EB Garamond', Georgia, serif", size: '1.2rem' },
  cinzel: { label: 'Cinzel (maiúsculas clássicas)', family: "'Cinzel', Georgia, serif", size: '1.05rem' },
  pinyon: { label: 'Pinyon Script (caligrafia)', family: "'Pinyon Script', cursive", size: '1.7rem' },
} as const;
export type FontKey = keyof typeof FONTS;

export const BACKGROUNDS = {
  pergaminho: { label: 'Pergaminho', bg: '#f3e8d2', fg: '#3b2a20' },
  marfim: { label: 'Marfim', bg: '#fbf7ef', fg: '#3b2a20' },
  rosa: { label: 'Rosa antigo', bg: '#f1dcd6', fg: '#4a2a2a' },
  neblina: { label: 'Azul névoa', bg: '#dfe6ea', fg: '#25323a' },
  borgonha: { label: 'Borgonha', bg: '#4a1f26', fg: '#f6ead6' },
} as const;
export type BackgroundKey = keyof typeof BACKGROUNDS;

export const HEX = /^#[0-9a-fA-F]{6}$/;

export function isFontKey(v: string): v is FontKey {
  return Object.prototype.hasOwnProperty.call(FONTS, v);
}
export function isBackground(v: string): boolean {
  return Object.prototype.hasOwnProperty.call(BACKGROUNDS, v) || HEX.test(v);
}

export function resolveFont(key: string) {
  return isFontKey(key) ? FONTS[key] : FONTS.cormorant;
}

export function resolveBackground(value: string): { bg: string; fg: string } {
  if (Object.prototype.hasOwnProperty.call(BACKGROUNDS, value)) return BACKGROUNDS[value as BackgroundKey];
  if (HEX.test(value)) {
    const r = parseInt(value.slice(1, 3), 16);
    const g = parseInt(value.slice(3, 5), 16);
    const b = parseInt(value.slice(5, 7), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return { bg: value, fg: lum > 0.55 ? '#3b2a20' : '#f6ead6' };
  }
  return BACKGROUNDS.pergaminho;
}
