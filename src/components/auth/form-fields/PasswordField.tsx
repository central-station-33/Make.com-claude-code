import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PasswordFieldProps {
  password: string;
  setPassword: (value: string) => void;
  isLoading: boolean;
  showRequirements?: boolean;
  label?: string;
  id?: string;
  placeholder?: string;
}

const passwordRequirements = [
  { rule: /.{8,}/, text: 'At least 8 characters' },
  { rule: /[A-Z]/, text: 'One uppercase letter' },
  { rule: /[a-z]/, text: 'One lowercase letter' },
  { rule: /[0-9]/, text: 'One number' },
  { rule: /[^A-Za-z0-9]/, text: 'One special character' },
];

export const PasswordField = ({
  password,
  setPassword,
  isLoading,
  showRequirements = false,
  label = "Password",
  id = "password",
  placeholder = "Enter your password"
}: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const validatePasswordRequirement = (requirement: RegExp) => requirement.test(password);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          className="w-full pr-10"
          placeholder={placeholder}
          autoComplete="current-password"
          aria-label={label}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
          disabled={isLoading}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-gray-500" />
          ) : (
            <Eye className="h-4 w-4 text-gray-500" />
          )}
        </Button>
      </div>
      {showRequirements && (
        <div className="mt-2 space-y-2">
          {passwordRequirements.map(({ rule, text }, index) => (
            <div key={index} className="flex items-center text-sm">
              <div
                className={`mr-2 h-2 w-2 rounded-full ${
                  validatePasswordRequirement(rule) ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
              <span
                className={
                  validatePasswordRequirement(rule) ? 'text-green-700' : 'text-gray-500'
                }
              >
                {text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};