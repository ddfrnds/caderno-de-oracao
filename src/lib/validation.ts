import { z } from 'zod';
import { isBackground, isFontKey } from './themes';

const bytes = (s: string) => new TextEncoder().encode(s).length;

const email = z.string().trim().toLowerCase().max(200).pipe(z.email('Informe um e-mail válido.'));
const password = z
  .string()
  .min(8, 'A senha precisa ter ao menos 8 caracteres.')
  .refine((s) => bytes(s) <= 72, 'A senha é longa demais (máximo de 72 bytes).');

export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Informe seu nome completo.')
      .max(120, 'Nome muito longo.')
      .refine((s) => s.split(/\s+/).length >= 2, 'Informe nome e sobrenome.'),
    email,
    password,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'As senhas não coincidem.' });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe sua senha.').max(200),
});

export const forgotSchema = z.object({ email });

export const resetSchema = z
  .object({ token: z.string().min(10).max(200), password, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'As senhas não coincidem.' });

export const submissionSchema = z.object({
  title: z.string().trim().max(150, 'Título muito longo (máximo 150).').optional(),
  body: z.string().trim().max(20000, 'Texto muito longo (máximo 20.000 caracteres).').optional(),
});

export const prayerSchema = z.object({
  title: z.string().trim().min(1, 'Informe o título.').max(150, 'Título muito longo (máximo 150).'),
  body: z.string().max(50000, 'Texto muito longo.'),
  font: z.string().refine(isFontKey, 'Fonte inválida.'),
  background: z.string().refine(isBackground, 'Fundo inválido.'),
});

export type FieldErrors = Record<string, string[] | undefined>;

export function fieldErrors(err: z.ZodError): FieldErrors {
  return z.flattenError(err).fieldErrors as FieldErrors;
}
