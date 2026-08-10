import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordFieldProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
};

export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
  required
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <label className="block">
      <span className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">{label}</span>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          minLength={minLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 pr-11 text-sm"
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
        />
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          tabIndex={-1}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500 hover:text-zinc-900"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
}