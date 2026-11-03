import { z } from 'zod';

export function normalizeIsbn(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase();
}

export function isValidIsbn13(isbn: string): boolean {
  if (!/^(978|979)\d{10}$/.test(isbn)) {
    return false;
  }

  const digits = isbn.split('').map(Number);

  const sum = digits.slice(0, 12).reduce((total, digit, index) => {
    return total + digit * (index % 2 === 0 ? 1 : 3);
  }, 0);

  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === digits[12];
}

export function isValidIsbn10(isbn: string): boolean {
  if (!/^\d{9}[\dX]$/.test(isbn)) {
    return false;
  }

  const digits = isbn.split('').map((digit) => (digit === 'X' ? 10 : Number(digit)));

  const sum = digits.reduce((total, digit, index) => {
    return total + digit * (10 - index);
  }, 0);

  return sum % 11 === 0;
}

export function convertIsbn10To13(isbn: string): string {
  const prefix = `978${isbn.slice(0, 9)}`;

  const digits = prefix.split('').map(Number);

  const sum = digits.reduce((total, digit, index) => {
    return total + digit * (index % 2 === 0 ? 1 : 3);
  }, 0);

  const checkDigit = (10 - (sum % 10)) % 10;

  return `${prefix}${checkDigit}`;
}

export function normalizeAndValidateIsbn(value: string): string {
  const isbn = normalizeIsbn(value);

  if (isValidIsbn13(isbn)) {
    return isbn;
  }

  if (isValidIsbn10(isbn)) {
    return convertIsbn10To13(isbn);
  }

  throw new Error('Invalid ISBN');
}

export const isbnSchema = z
  .string()
  .trim()
  .transform(normalizeIsbn)
  .refine((isbn) => isValidIsbn10(isbn) || isValidIsbn13(isbn), { error: 'Invalid ISBN' })
  .transform((isbn) => (isValidIsbn10(isbn) ? convertIsbn10To13(isbn) : isbn));
