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

/** Molduras prontas (imagem + área útil do papel, em % da imagem). 'large' = papel que ocupa quase toda a tela. */
export type Skin = {
  id: string;
  label: string;
  kind: 'frame' | 'large';
  w: number;
  h: number;
  paper: { top: number; right: number; bottom: number; left: number };
  backdrop: string;
  seal?: string;
  texture?: string;
};
export const SKIN_PREFIX = 'skin:';
export const SKINS: Skin[] = [
  { id: 'azul-selo', label: 'Azul com selo', kind: 'frame', w: 900, h: 1599, paper: { top: 22.6, right: 15, bottom: 22.8, left: 16 }, backdrop: '#09182f' },
  { id: 'azul-toile', label: 'Azul e toile', kind: 'frame', w: 900, h: 1600, paper: { top: 26.8, right: 20, bottom: 34, left: 21 }, backdrop: '#1f2d52' },
  { id: 'vinho-barroco', label: 'Vinho barroco', kind: 'frame', w: 900, h: 1599, paper: { top: 31, right: 22, bottom: 27.5, left: 25 }, backdrop: '#3d0103' },
  { id: 'vinho-lirios', label: 'Vinho com lírios', kind: 'frame', w: 900, h: 1599, paper: { top: 28.5, right: 7, bottom: 37.7, left: 8 }, backdrop: '#350805' },
  { id: 'azul-estrelas', label: 'Azul estrelado', kind: 'frame', w: 900, h: 1600, paper: { top: 27, right: 16, bottom: 22, left: 16.5 }, backdrop: '#384963' },
  { id: 'verde-orquideas', label: 'Verde com orquídeas', kind: 'frame', w: 900, h: 1600, paper: { top: 25, right: 24, bottom: 22.5, left: 20 }, backdrop: '#3a3f17' },
  { id: 'natal-xadrez', label: 'Natal xadrez', kind: 'frame', w: 900, h: 1600, paper: { top: 16.5, right: 11, bottom: 28, left: 11.5 }, backdrop: '#2b3b34' },
  { id: 'papel-verde', label: 'Papel verde com selo', kind: 'frame', w: 900, h: 1600, paper: { top: 18, right: 8, bottom: 15, left: 8 }, backdrop: '#122e1f' },
  { id: 'papel-vinho', label: 'Papel vinho com selo', kind: 'frame', w: 900, h: 1599, paper: { top: 20, right: 10, bottom: 17, left: 10 }, backdrop: '#3d0103' },
  { id: 'xadrez-trico', label: 'Xadrez e tricô', kind: 'frame', w: 900, h: 1600, paper: { top: 15, right: 6, bottom: 15, left: 15 }, backdrop: '#6b4a3a' },
  { id: 'vinho-cartucho', label: 'Vinho cartucho', kind: 'frame', w: 900, h: 1599, paper: { top: 29, right: 21, bottom: 23, left: 21 }, backdrop: '#220308' },
  { id: 'verde-lirios', label: 'Verde com lírios', kind: 'frame', w: 900, h: 1599, paper: { top: 34.4, right: 14.4, bottom: 22.8, left: 24.5 }, backdrop: '#4b5a2b' },
  { id: 'grande-verde', label: 'Papel grande verde (orações longas)', kind: 'large', w: 0, h: 0, paper: { top: 0, right: 0, bottom: 0, left: 0 }, backdrop: '#122e1f', seal: '/img/fundos/papel-verde-selo.png', texture: '/img/fundos/papel-verde-papel.jpg' },
  { id: 'grande-vinho', label: 'Papel grande vinho (orações longas)', kind: 'large', w: 0, h: 0, paper: { top: 0, right: 0, bottom: 0, left: 0 }, backdrop: '#3d0103', seal: '/img/fundos/papel-vinho-selo.png', texture: '/img/fundos/papel-vinho-papel.jpg' },
];
export const skinSrc = (s: Skin) => `/img/fundos/${s.id}.jpg`;
export const skinThumb = (s: Skin) => (s.kind === 'large' ? s.texture!.replace('-papel.jpg', '-t.jpg') : `/img/fundos/${s.id}-t.jpg`);
export function skinFor(value: string): Skin | null {
  return value.startsWith(SKIN_PREFIX) ? (SKINS.find((s) => s.id === value.slice(SKIN_PREFIX.length)) ?? null) : null;
}

export const HEX = /^#[0-9a-fA-F]{6}$/;

export function isFontKey(v: string): v is FontKey {
  return Object.prototype.hasOwnProperty.call(FONTS, v);
}
export function isBackground(v: string): boolean {
  return Object.prototype.hasOwnProperty.call(BACKGROUNDS, v) || HEX.test(v) || skinFor(v) !== null;
}

export function resolveFont(key: string) {
  return isFontKey(key) ? FONTS[key] : FONTS.cormorant;
}

export function resolveBackground(value: string): { bg: string; fg: string } {
  const skin = skinFor(value);
  if (skin) return { bg: skin.backdrop, fg: '#3b2a20' };
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
