type TimeInputProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  placeholder?: string;
};

/** Controlled mm:ss:mmm digit mask (digits only; colons inserted). */
export function TimeInput({
  value,
  onChange,
  id,
  placeholder = "00:00:000",
  ...rest
}: TimeInputProps) {
  function handleChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 7);
    if (digits.length <= 2) {
      onChange(digits);
      return;
    }
    if (digits.length <= 4) {
      onChange(`${digits.slice(0, 2)}:${digits.slice(2)}`);
      return;
    }
    onChange(
      `${digits.slice(0, 2)}:${digits.slice(2, 4)}:${digits.slice(4)}`,
    );
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      spellCheck={false}
      value={value}
      placeholder={placeholder}
      onChange={(e) => handleChange(e.target.value)}
      {...rest}
    />
  );
}
