const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;

// Accepts:
// - +97798XXXXXXXX or +97797XXXXXXXX or +97796XXXXXXXX
// - 98XXXXXXXX, 97XXXXXXXX, 96XXXXXXXX (10 digits)
const nepalPhoneRegex = /^(\+977(?:98|97|96)\d{8}|(?:98|97|96)\d{8})$/;

export function validateStrongPassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (!strongPasswordRegex.test(password)) {
    return 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';
  }
  return null;
}

export function validateNepalPhone(phone: string): string | null {
  if (!phone) return null; // optional on frontend
  if (!nepalPhoneRegex.test(phone)) {
    return 'Enter a valid Nepali phone number (e.g., +97798..., 98..., 97..., 96...)';
  }
  return null;
}

