export interface ValidationErrors {
  [key: string]: string;
}

export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Invalid email format';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain a number';
  return null;
};

export const validateUsername = (username: string): string | null => {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (username.length > 20) return 'Username must be at most 20 characters';
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
  return null;
};

export const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};

export const validateDisplayName = (name: string): string | null => {
  if (name && name.length > 50) return 'Display name must be at most 50 characters';
  return null;
};

export const validateLoginForm = (email: string, password: string): ValidationErrors => {
  const errors: ValidationErrors = {};

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  if (!password) errors.password = 'Password is required';

  return errors;
};

export const validateRegisterForm = (
  username: string,
  email: string,
  password: string,
  confirmPassword: string,
  acceptTerms: boolean
): ValidationErrors => {
  const errors: ValidationErrors = {};

  const usernameError = validateUsername(username);
  if (usernameError) errors.username = usernameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  const confirmPasswordError = validateConfirmPassword(password, confirmPassword);
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

  if (!acceptTerms) errors.terms = 'You must accept the terms and conditions';

  return errors;
};

export const validatePasswordChange = (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!currentPassword) errors.currentPassword = 'Current password is required';

  const passwordError = validatePassword(newPassword);
  if (passwordError) errors.newPassword = passwordError;

  const confirmPasswordError = validateConfirmPassword(newPassword, confirmPassword);
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.newPassword = 'New password must be different from current password';
  }

  return errors;
};
