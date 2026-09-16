// Shared email/password validation for the hand-rolled auth pages (Login/Signup).
// Kept in one place instead of duplicated per-page so the rules can't drift.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function sanitizeInput(value: string): string {
  return value.trim();
}

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  colorClassName: string;
};

export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const levels: Record<number, Omit<PasswordStrength, 'score'>> = {
    0: { label: 'Too weak', colorClassName: 'bg-destructive' },
    1: { label: 'Weak', colorClassName: 'bg-destructive' },
    2: { label: 'Okay', colorClassName: 'bg-warning' },
    3: { label: 'Good', colorClassName: 'bg-secondary' },
    4: { label: 'Strong', colorClassName: 'bg-success' },
  };

  return { score: score as PasswordStrength['score'], ...levels[score] };
}
