"use client";

import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password?: string;
}

export function PasswordStrengthIndicator({ password = '' }: PasswordStrengthIndicatorProps) {
  const [strength, setStrength] = useState({ level: 0, label: '' });

  useEffect(() => {
    const calculateStrength = (pass: string) => {
      let score = 0;
      if (!pass) return { level: 0, label: '' };
      
      const checks = [
        pass.length >= 8,         // At least 8 characters
        /[a-z]/.test(pass),       // Lowercase letters
        /[A-Z]/.test(pass),       // Uppercase letters
        /[0-9]/.test(pass),       // Numbers
        /[^a-zA-Z0-9]/.test(pass)  // Symbols
      ];
      score = checks.filter(Boolean).length;
      
      let level = 0;
      let label = '';
      if (pass.length > 0 && score <= 2) {
        level = 1;
        label = 'Weak';
      } else if (score >= 3 && score < 5) {
        level = 2;
        label = 'Medium';
      } else if (score === 5) {
        level = 3;
        label = 'Strong';
      }
      return { level, label };
    };

    setStrength(calculateStrength(password));
  }, [password]);

  if (!password) return null;

  return (
    <div className="w-full mt-2">
      <div className="flex gap-1 h-1.5 rounded-full w-full">
        <div className={cn("flex-1 transition-colors duration-300 rounded-l-full", strength.level >= 1 ? 'bg-destructive' : 'bg-muted')} />
        <div className={cn("flex-1 transition-colors duration-300", strength.level >= 2 ? 'bg-yellow-400' : 'bg-muted')} />
        <div className={cn("flex-1 transition-colors duration-300 rounded-r-full", strength.level >= 3 ? 'bg-green-500' : 'bg-muted')} />
      </div>
      {strength.label && (
        <p className="text-xs text-right text-muted-foreground mt-1">
          {strength.label}
        </p>
      )}
    </div>
  );
};
