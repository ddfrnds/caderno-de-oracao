import { describe, expect, it } from 'vitest';
import { safeNext } from '../src/lib/safe-next';
import { sniffFile } from '../src/lib/file-sniff';
import { slugify } from '../src/lib/slug';
import { loginSchema, prayerSchema, signupSchema, submissionSchema } from '../src/lib/validation';
import { resolveBackground, resolveFont } from '../src/lib/themes';
import { PDF, PNG } from './helpers';

describe('safeNext', () => {
  it('aceita caminhos internos', () => {
    expect(safeNext('/enviar')).toBe('/enviar');
    expect(safeNext('/oracoes/abc?x=1')).toBe('/oracoes/abc?x=1');
  });
  it('rejeita redirecionamentos externos', () => {
    for (const bad of ['//evil.com', 'https://evil.com', '/\\evil.com', 'javascript:alert(1)', '', undefined, '/a\nb']) {
      expect(safeNext(bad, '/x')).toBe('/x');
    }
  });
});

describe('sniffFile', () => {
  it('reconhece imagem e pdf pelo conteúdo', () => {
    expect(sniffFile(PNG)?.mime).toBe('image/png');
    expect(sniffFile(PDF)?.kind).toBe('document');
  });
  it('aceita texto puro e rejeita binário desconhecido, html disfarçado de imagem e executáveis', () => {
    expect(sniffFile(Buffer.from('Ave Maria, cheia de graça'))?.ext).toBe('txt');
    expect(sniffFile(Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]))).toBeNull();
    expect(sniffFile(Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04]))).toBeNull();
  });
  it('zip genérico não é aceito', () => {
    expect(sniffFile(Buffer.from([0x50, 0x4b, 0x03, 0x04, 1, 2, 3, 4]))).toBeNull();
  });
});

describe('validation', () => {
  it('cadastro exige nome completo, e-mail válido e senhas iguais', () => {
    const ok = signupSchema.safeParse({ name: 'Maria Silva', email: 'MARIA@x.com', password: '12345678', confirm: '12345678' });
    expect(ok.success && ok.data.email).toBe('maria@x.com');
    expect(signupSchema.safeParse({ name: 'Maria', email: 'a@b.co', password: '12345678', confirm: '12345678' }).success).toBe(false);
    expect(signupSchema.safeParse({ name: 'Maria Silva', email: 'x', password: '12345678', confirm: '12345678' }).success).toBe(false);
    expect(signupSchema.safeParse({ name: 'Maria Silva', email: 'a@b.co', password: '1234567', confirm: '1234567' }).success).toBe(false);
    expect(signupSchema.safeParse({ name: 'Maria Silva', email: 'a@b.co', password: '12345678', confirm: '123456789' }).success).toBe(false);
  });
  it('login e envio', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
    expect(submissionSchema.safeParse({ body: 'x'.repeat(20001) }).success).toBe(false);
  });
  it('oração valida fonte e fundo', () => {
    const base = { title: 'Ave Maria', body: 'texto' };
    expect(prayerSchema.safeParse({ ...base, font: 'cinzel', background: '#aabbcc' }).success).toBe(true);
    expect(prayerSchema.safeParse({ ...base, font: 'comic', background: 'marfim' }).success).toBe(false);
    expect(prayerSchema.safeParse({ ...base, font: 'cinzel', background: 'url(x)' }).success).toBe(false);
  });
});

describe('slug e temas', () => {
  it('slugify remove acentos', () => expect(slugify('Oração à Nossa Senhora!')).toBe('oracao-a-nossa-senhora'));
  it('fundo escuro recebe texto claro', () => {
    expect(resolveBackground('#101010').fg).toBe('#f6ead6');
    expect(resolveBackground('#ffffff').fg).toBe('#3b2a20');
    expect(resolveFont('inexistente').family).toContain('Cormorant');
  });
});
