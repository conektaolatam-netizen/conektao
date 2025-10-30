// Secure password generation utility

/**
 * Generates a cryptographically secure random password
 * @param length Password length (minimum 12, default 16)
 * @returns Secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  if (length < 12) {
    throw new Error('Password length must be at least 12 characters');
  }

  // Character sets for password generation
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  // Ensure at least one character from each set
  let password = '';
  password += getRandomChar(lowercase);
  password += getRandomChar(uppercase);
  password += getRandomChar(numbers);
  password += getRandomChar(symbols);
  
  // Fill remaining length with random characters
  for (let i = 4; i < length; i++) {
    password += getRandomChar(allChars);
  }
  
  // Shuffle the password to avoid predictable patterns
  return shuffleString(password);
}

/**
 * Gets a cryptographically secure random character from a string
 */
function getRandomChar(chars: string): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return chars[array[0] % chars.length];
}

/**
 * Shuffles a string using Fisher-Yates algorithm with crypto random
 */
function shuffleString(str: string): string {
  const array = str.split('');
  for (let i = array.length - 1; i > 0; i--) {
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    const j = randomArray[0] % (i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array.join('');
}

/**
 * Validates password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}