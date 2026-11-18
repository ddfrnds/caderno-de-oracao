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
  w: number; // imagem de 900 px de largura
  h: number;
  /** recorte da imagem usado no livro (px da imagem) */
  crop: { x0: number; y0: number; x1: number; y1: number };
  /** bordas internas do papel liso (px da imagem inteira) */
  paper: { l: number; t: number; r: number; b: number };
  /** faixas de linhas e as colunas "limpas" onde a moldura pode ser esticada sem repetir enfeites */
  bands: { y0: number; y1: number; xl: [number, number]; xr: [number, number] }[];
  /** linhas limpas para esticar na vertical */
  yCut: [number, number];
  backdrop: string;
  /** reduz a escala da moldura para sobrar mais papel (molduras com muita margem decorativa) */
  zoom?: number;
  seal?: string;
  texture?: string;
};
export const SKIN_PREFIX = 'skin:';
const NO_CUT = { crop: { x0: 0, y0: 0, x1: 0, y1: 0 }, paper: { l: 0, t: 0, r: 0, b: 0 }, bands: [], yCut: [0, 0] as [number, number] };
export const SKINS: Skin[] = [
  { id: 'azul-selo', label: 'Azul com selo', kind: 'frame', w: 900, h: 1599, crop: { x0: 31, y0: 76, x1: 869, y1: 1406 }, paper: { l: 144, t: 361, r: 764, b: 1235 }, bands: [{ y0: 76, y1: 1406, xl: [183, 232], xr: [660, 709] }], yCut: [611, 660], backdrop: '#09182f' },
  { id: 'azul-toile', label: 'Azul e toile', kind: 'frame', w: 900, h: 1600, crop: { x0: 33, y0: 253, x1: 816, y1: 1473 }, paper: { l: 189, t: 429, r: 720, b: 1173 }, bands: [{ y0: 253, y1: 1473, xl: [387, 440], xr: [460, 513] }], yCut: [640, 693], backdrop: '#1f2d52' },
  { id: 'vinho-barroco', label: 'Vinho barroco', kind: 'frame', w: 900, h: 1599, crop: { x0: 22, y0: 257, x1: 893, y1: 1355 }, paper: { l: 214, t: 428, r: 703, b: 1174 }, bands: [{ y0: 257, y1: 1355, xl: [306, 355], xr: [550, 599] }], yCut: [746, 795], backdrop: '#3d0103' },
  { id: 'vinho-lirios', label: 'Vinho com lírios', kind: 'frame', w: 900, h: 1599, crop: { x0: 0, y0: 24, x1: 900, y1: 1577 }, paper: { l: 160, t: 455, r: 740, b: 997 }, bands: [{ y0: 24, y1: 1577, xl: [306, 355], xr: [367, 416] }], yCut: [685, 734], zoom: 0.5, backdrop: '#350805' },
  { id: 'azul-estrelas', label: 'Azul estrelado', kind: 'frame', w: 900, h: 1600, crop: { x0: 37, y0: 157, x1: 864, y1: 1483 }, paper: { l: 144, t: 429, r: 760, b: 1300 }, bands: [{ y0: 157, y1: 1483, xl: [347, 400], xr: [460, 513] }], yCut: [667, 720], backdrop: '#384963' },
  { id: 'verde-orquideas', label: 'Verde com orquídeas', kind: 'frame', w: 900, h: 1600, crop: { x0: 24, y0: 157, x1: 873, y1: 1420 }, paper: { l: 149, t: 367, r: 757, b: 1240 }, bands: [{ y0: 157, y1: 1420, xl: [347, 400], xr: [460, 513] }], yCut: [667, 720], backdrop: '#3a3f17' },
  { id: 'natal-xadrez', label: 'Natal xadrez', kind: 'frame', w: 900, h: 1600, crop: { x0: 0, y0: 40, x1: 900, y1: 1573 }, paper: { l: 100, t: 253, r: 804, b: 1260 }, bands: [{ y0: 40, y1: 1573, xl: [400, 453], xr: [460, 513] }], yCut: [693, 747], backdrop: '#2b3b34' },
  { id: 'xadrez-trico', label: 'Xadrez e tricô', kind: 'frame', w: 900, h: 1600, crop: { x0: 0, y0: 0, x1: 900, y1: 1600 }, paper: { l: 149, t: 237, r: 849, b: 1367 }, bands: [{ y0: 0, y1: 1600, xl: [267, 320], xr: [600, 653] }], yCut: [747, 800], backdrop: '#6b4a3a' },
  { id: 'vinho-cartucho', label: 'Vinho cartucho', kind: 'frame', w: 900, h: 1599, crop: { x0: 27, y0: 147, x1: 874, y1: 1449 }, paper: { l: 190, t: 463, r: 710, b: 1231 }, bands: [{ y0: 147, y1: 1449, xl: [269, 318], xr: [587, 636] }], yCut: [795, 844], backdrop: '#220308' },
  { id: 'verde-lirios', label: 'Verde com lírios', kind: 'frame', w: 900, h: 1599, crop: { x0: 0, y0: 98, x1: 900, y1: 1486 }, paper: { l: 159, t: 575, r: 783, b: 1223 }, bands: [{ y0: 98, y1: 636, xl: [183, 232], xr: [306, 355] },{ y0: 636, y1: 893, xl: [183, 232], xr: [489, 538] },{ y0: 893, y1: 1486, xl: [550, 599], xr: [636, 685] }], yCut: [685, 734], backdrop: '#4b5a2b' },
  { id: 'grande-verde', label: 'Papel grande verde (orações longas)', kind: 'large', w: 0, h: 0, ...NO_CUT, backdrop: '#122e1f', seal: '/img/fundos/papel-verde-selo.png', texture: '/img/fundos/papel-verde-papel.jpg' },
  { id: 'grande-vinho', label: 'Papel grande vinho (orações longas)', kind: 'large', w: 0, h: 0, ...NO_CUT, backdrop: '#3d0103', seal: '/img/fundos/papel-vinho-selo.png', texture: '/img/fundos/papel-vinho-papel.jpg' },
];
/** Área do papel em % da imagem inteira (pré-visualização), com folga interna. */
export function skinPaperPct(s: Skin) {
  const m = 0.03;
  return {
    left: (s.paper.l / s.w) * 100 + m * 100 * 0.6,
    right: ((s.w - s.paper.r) / s.w) * 100 + m * 100 * 0.6,
    top: (s.paper.t / s.h) * 100 + 1.5,
    bottom: ((s.h - s.paper.b) / s.h) * 100 + 1.5,
  };
}
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
