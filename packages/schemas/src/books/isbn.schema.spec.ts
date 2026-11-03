import { describe, expect, it } from 'vitest';
import {
  convertIsbn10To13,
  isValidIsbn10,
  isValidIsbn13,
  normalizeAndValidateIsbn,
} from './isbn.schema.ts';

describe('ISBN Validation', () => {
  it('should validate a valid ISBN-13', () => {
    expect(isValidIsbn13('9780735211292')).toBe(true);
  });

  it('should reject an invalid ISBN-13', () => {
    expect(isValidIsbn13('9780735211293')).toBe(false);
  });

  it('should validate a valid ISBN-10', () => {
    expect(isValidIsbn10('0735211299')).toBe(true);
  });

  it('should validate ISBN-10 with X check digit', () => {
    expect(isValidIsbn10('080442957X')).toBe(true);
  });

  it('should convert ISBN-10 to ISBN-13', () => {
    expect(convertIsbn10To13('0735211299')).toBe('9780735211292');
  });

  it('should normalize ISBN by removing spaces and hyphens', () => {
    expect(normalizeAndValidateIsbn('978-0-7352-1129-2')).toBe('9780735211292');
  });

  it('should convert ISBN-10 with X check digit to ISBN-13', () => {
    expect(normalizeAndValidateIsbn('080442957X')).toBe('9780804429573');
  });

  it('should reject an invalid ISBN', () => {
    expect(() => normalizeAndValidateIsbn('9780735211293')).toThrow('Invalid ISBN');
  });

  it('should reject ISBN-13 without 978 or 979 prefix', () => {
    expect(isValidIsbn13('1234567890128')).toBe(false);
  });
});
