type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  multiline?: boolean;
  placeholder?: string;
  disabled?: boolean;
  type?: "text" | "email" | "password";
  name?: string;
  autoComplete?: string;
};

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  multiline = false,
  placeholder,
  disabled = false,
  type = "text",
  name,
  autoComplete,
}: TextFieldProps) {
  const errorId = `${id}-error`;
  const fieldClass = multiline ? "field field-multiline body1" : "field body1";

  return (
    <div className="flex flex-col gap-2">
      <label className="body2" htmlFor={id}>
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          className={fieldClass}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          className={fieldClass}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {error ? (
        <p id={errorId} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
