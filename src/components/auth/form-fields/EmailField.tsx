
import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmailFieldProps {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
}

export const EmailField = ({ value, onChange, isLoading = false }: EmailFieldProps) => {
  const validateEmail = useCallback((email: string) => {
    if (!email.trim()) {
      return "Email is required";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  }, []);

  const [touched, setTouched] = useState(false);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  // Don't show a validation error on first paint, before the user has
  // touched the field -- previously this rendered "Email is required"
  // and a red border immediately on page load, before any interaction.
  const rawError = validateEmail(value);
  const emailError = touched ? rawError : "";

  return (
    <div className="space-y-2">
      <Label htmlFor="email" className="text-sm font-medium">
        Email
      </Label>
      <Input
        id="email"
        type="email"
        value={value}
        onChange={handleEmailChange}
        onBlur={() => setTouched(true)}
        required
        disabled={isLoading}
        className={`w-full ${emailError ? "border-red-500 focus:ring-red-500" : ""}`}
        placeholder="Enter your email"
        autoComplete="email"
        aria-label="Email address"
        aria-invalid={!!emailError}
        aria-describedby={emailError ? "email-error" : undefined}
      />
      {emailError && (
        <p id="email-error" className="text-sm text-red-500 mt-1" role="alert">
          {emailError}
        </p>
      )}
    </div>
  );
};
