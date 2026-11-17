import type { FieldErrors } from '@/lib/validation';

export function Field({
  label, name, type = 'text', errors, defaultValue, autoComplete, hint, required = true,
}: {
  label: string; name: string; type?: string; errors?: FieldErrors; defaultValue?: string; autoComplete?: string; hint?: string; required?: boolean;
}) {
  const err = errors?.[name]?.[0];
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name} name={name} type={type} defaultValue={defaultValue} autoComplete={autoComplete} required={required}
        aria-invalid={err ? true : undefined} aria-describedby={err ? `${name}-err` : undefined}
      />
      {hint && !err && <span className="hint">{hint}</span>}
      {err && <span id={`${name}-err`} className="error" role="alert">{err}</span>}
    </div>
  );
}
