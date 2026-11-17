import { describe, expect, it } from 'vitest';
import { parseInline, parsePrayerBody, splitTitle } from '../src/lib/prayer-body';

describe('parsePrayerBody', () => {
  it('reconhece títulos, linhas centralizadas e parágrafos', () => {
    const blocks = parsePrayerBody('## Primeira Oração\n> (Subtítulo)\n> **Pai Nosso, Ave-Maria...**\n\nÓ Jesus,\nlembrai-Vos.\n\nOutro parágrafo.');
    expect(blocks.map((b) => b.type)).toEqual(['heading', 'center', 'p', 'p']);
    expect(blocks[1]).toMatchObject({ type: 'center', lines: [[{ text: '(Subtítulo)' }], [{ text: 'Pai Nosso, Ave-Maria...', bold: true }]] });
    expect(blocks[2]).toMatchObject({ type: 'p', lines: [[{ text: 'Ó Jesus,' }], [{ text: 'lembrai-Vos.' }]] });
  });
  it('negrito e itálico no meio do texto, sem interpretar HTML', () => {
    expect(parseInline('a **b** c *d* <b>e</b>')).toEqual([
      { text: 'a ' }, { text: 'b', bold: true }, { text: ' c ' }, { text: 'd', italic: true }, { text: ' <b>e</b>' },
    ]);
  });
  it('texto simples (envio de usuário) continua funcionando', () => {
    const blocks = parsePrayerBody('Senhor, guia meu dia.\n\nAmém.\r\n');
    expect(blocks.map((b) => b.type)).toEqual(['p', 'p']);
  });
  it('texto vazio não gera blocos', () => expect(parsePrayerBody('')).toEqual([]));
});

describe('splitTitle', () => {
  it('separa título e autor', () => {
    expect(splitTitle('Meditação sobre as 15 chagas secretas de Cristo - Santa Brígida')).toEqual({
      main: 'Meditação sobre as 15 chagas secretas de Cristo', sub: 'Santa Brígida',
    });
    expect(splitTitle('Ave Maria')).toEqual({ main: 'Ave Maria' });
  });
});
