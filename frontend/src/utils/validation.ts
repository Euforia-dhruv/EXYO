export interface ValidationErrors {
  [key: string]: string;
}

export const validateDisplayName = (name: string): string | null => {
  if (name && name.length > 50) return 'Display name must be at most 50 characters';
  return null;
};
