import type { FieldErrors } from './validation';

export type FormState =
  | {
      errors?: FieldErrors;
      message?: string;
      ok?: boolean;
      values?: Record<string, string>;
    }
  | undefined;
