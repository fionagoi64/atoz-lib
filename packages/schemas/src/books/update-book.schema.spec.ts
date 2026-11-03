import { describe, expect, it } from 'vitest';
import { updateBookSchema } from './update-book.schema.ts';

describe('UpdateBookSchema', () => {
  it('should accept a valid title update', () => {
    expect(updateBookSchema.safeParse({ title: 'New Title' }).success).toBe(true);
  });

  it('should accept null author', () => {
    expect(updateBookSchema.safeParse({ author: null }).success).toBe(true);
  });

  it('should accept null ISBN', () => {
    expect(updateBookSchema.safeParse({ isbn: null }).success).toBe(true);
  });

  it('should normalize ISBN-10 to ISBN-13', () => {
    const result = updateBookSchema.safeParse({
      isbn: '0735211299',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.isbn).toBe('9780735211292');
    }
  });

  it('should reject an empty request body', () => {
    expect(updateBookSchema.safeParse({}).success).toBe(false);
  });

  it('should reject an empty title', () => {
    expect(updateBookSchema.safeParse({ title: '   ' }).success).toBe(false);
  });

  it('should reject an invalid ISBN', () => {
    expect(updateBookSchema.safeParse({ isbn: '9780735211293' }).success).toBe(false);
  });
});
