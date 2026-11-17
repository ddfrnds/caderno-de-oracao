/**
 * Formatação leve para o texto das orações (sem HTML):
 *   ## Título            → título centralizado
 *   > linha              → linha centralizada (linhas seguidas formam um bloco)
 *   **negrito**  *itálico*
 *   linha em branco      → novo parágrafo (quebras simples viram quebra de linha)
 */
export type Inline = { text: string; bold?: boolean; italic?: boolean };
export type Block =
  | { type: 'heading'; content: Inline[] }
  | { type: 'center'; lines: Inline[][] }
  | { type: 'p'; lines: Inline[][] };

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    if (m.index > last) out.push({ text: src.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ text: m[1], bold: true });
    else out.push({ text: m[2], italic: true });
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push({ text: src.slice(last) });
  return out.length ? out : [{ text: '' }];
}

export function parsePrayerBody(body: string): Block[] {
  const blocks: Block[] = [];
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  let para: string[] = [];
  let center: string[] = [];

  const flushPara = () => {
    if (para.length) blocks.push({ type: 'p', lines: para.map(parseInline) });
    para = [];
  };
  const flushCenter = () => {
    if (center.length) blocks.push({ type: 'center', lines: center.map(parseInline) });
    center = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.trim() === '') {
      flushPara();
      flushCenter();
    } else if (/^##\s+/.test(line)) {
      flushPara();
      flushCenter();
      blocks.push({ type: 'heading', content: parseInline(line.replace(/^##\s+/, '')) });
    } else if (/^>\s?/.test(line)) {
      flushPara();
      center.push(line.replace(/^>\s?/, ''));
    } else {
      flushCenter();
      para.push(line);
    }
  }
  flushPara();
  flushCenter();
  return blocks;
}

/** "Título - Autor" → { main, sub }. */
export function splitTitle(title: string): { main: string; sub?: string } {
  const m = /^(.+?)\s+[-–—]\s+(.+)$/.exec(title.trim());
  return m ? { main: m[1].replace(/[.\s]+$/, ''), sub: m[2].replace(/[.\s]+$/, '') } : { main: title.trim() };
}
