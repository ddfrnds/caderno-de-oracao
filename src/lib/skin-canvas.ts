import type { Skin } from './themes';

export type Retargeted = {
  canvas: HTMLCanvasElement;
  /** margens do papel em px de tela (já na escala final) */
  inset: { left: number; right: number; top: number; bottom: number };
};

type Rect = { sx: number; sy: number; sw: number; sh: number };

function make(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  return { c, ctx };
}

/** Desenha `src[r]` em (x,y), opcionalmente espelhado — o espelho garante emenda contínua. */
function put(ctx: CanvasRenderingContext2D, src: CanvasImageSource, r: Rect, x: number, y: number, flipX = false, flipY = false) {
  ctx.save();
  ctx.translate(flipX ? x + r.sw : x, flipY ? y + r.sh : y);
  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  ctx.drawImage(src, r.sx, r.sy, r.sw, r.sh, 0, 0, r.sw, r.sh);
  ctx.restore();
}

/**
 * Adapta a imagem da moldura a qualquer tamanho de tela: os cantos e enfeites ficam intactos e só as
 * faixas "limpas" (renda/papel liso) são alongadas com cópias espelhadas, sem emendas visíveis.
 */
export function retarget(img: CanvasImageSource & { width: number; height: number }, skin: Skin, boxW: number, boxH: number, dpr: number): Retargeted {
  const { crop, paper } = skin;
  const Wc = crop.x1 - crop.x0;
  const Hc = crop.y1 - crop.y0;
  const base = make(Wc, Hc);
  base.ctx.drawImage(img, crop.x0, crop.y0, Wc, Hc, 0, 0, Wc, Hc);

  // espessura desejada da renda na tela
  const thick = paper.l - crop.x0;
  const want = Math.min(80, Math.max(30, boxW * 0.085));
  const s = Math.min(want / thick, boxW / Wc, boxH / Hc) * (skin.zoom ?? 1);
  const ex = Math.max(0, boxW / s - Wc);
  const ey = Math.max(0, boxH / s - Hc);

  // --- horizontal: por faixa de linhas, insere pares [espelho, original] ---
  const bw = skin.bands[0].xl[1] - skin.bands[0].xl[0];
  const pairsX = Math.round(ex / (2 * bw));
  const kL = pairsX >> 1;
  const kR = pairsX - kL;
  const Wk = Wc + 2 * bw * pairsX;
  const stepX = make(Wk, Hc);
  for (const b of skin.bands) {
    const y0 = Math.max(0, b.y0 - crop.y0);
    const y1 = Math.min(Hc, b.y1 - crop.y0);
    const h = y1 - y0;
    const la = b.xl[0] - crop.x0, lb = b.xl[1] - crop.x0;
    const ra = b.xr[0] - crop.x0, rb = b.xr[1] - crop.x0;
    const L: Rect = { sx: la, sy: y0, sw: lb - la, sh: h };
    const R: Rect = { sx: ra, sy: y0, sw: rb - ra, sh: h };
    let x = 0;
    put(stepX.ctx, base.c, { sx: 0, sy: y0, sw: lb, sh: h }, x, y0); x += lb;
    for (let j = 0; j < kL; j++) { put(stepX.ctx, base.c, L, x, y0, true); x += L.sw; put(stepX.ctx, base.c, L, x, y0); x += L.sw; }
    put(stepX.ctx, base.c, { sx: lb, sy: y0, sw: ra - lb, sh: h }, x, y0); x += ra - lb;
    for (let j = 0; j < kR; j++) { put(stepX.ctx, base.c, R, x, y0); x += R.sw; put(stepX.ctx, base.c, R, x, y0, true); x += R.sw; }
    put(stepX.ctx, base.c, { sx: ra, sy: y0, sw: Wc - ra, sh: h }, x, y0);
  }

  // --- vertical: pares de linhas espelhadas no meio do papel ---
  const ya = skin.yCut[0] - crop.y0, yb = skin.yCut[1] - crop.y0;
  const bh = yb - ya;
  const pairsY = Math.round(ey / (2 * bh));
  const Hk = Hc + 2 * bh * pairsY;
  const stepY = make(Wk, Hk);
  const V: Rect = { sx: 0, sy: ya, sw: Wk, sh: bh };
  put(stepY.ctx, stepX.c, { sx: 0, sy: 0, sw: Wk, sh: yb }, 0, 0);
  let y = yb;
  for (let j = 0; j < pairsY; j++) { put(stepY.ctx, stepX.c, V, 0, y, false, true); y += bh; put(stepY.ctx, stepX.c, V, 0, y); y += bh; }
  put(stepY.ctx, stepX.c, { sx: 0, sy: yb, sw: Wk, sh: Hc - yb }, 0, y);

  const out = make(boxW * dpr, boxH * dpr);
  out.ctx.drawImage(stepY.c, 0, 0, Wk, Hk, 0, 0, out.c.width, out.c.height);
  const sx = boxW / Wk;
  const sy = boxH / Hk;
  return {
    canvas: out.c,
    inset: {
      left: (paper.l - crop.x0) * sx,
      right: (crop.x1 - paper.r) * sx,
      top: (paper.t - crop.y0) * sy,
      bottom: (crop.y1 - paper.b) * sy,
    },
  };
}
