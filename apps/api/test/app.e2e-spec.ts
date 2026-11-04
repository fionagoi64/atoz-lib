import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

// Generate a unique, valid ISBN-13 for each test run.
function generateTestIsbn13(): string {
  const digits = `978${randomUUID().replace(/\D/g, '').slice(0, 9)}`;

  const sum = digits.split('').reduce((total, digit, index) => {
    return total + Number(digit) * (index % 2 === 0 ? 1 : 3);
  }, 0);

  return `${digits}${(10 - (sum % 10)) % 10}`;
}

describe('Books API (e2e)', () => {
  let app: INestApplication<App>;
  let createdBookId: string;

  const testBook = {
    title: 'E2E Test - Atomic Habits',
    author: 'James Clear',
    isbn: generateTestIsbn13(),
  };

  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL) {
      throw new Error('TEST_DATABASE_URL is not configured');
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();
  });

  afterAll(async () => {
    try {
      if (createdBookId && app) {
        const prisma = app.get(PrismaService);

        // Delete related audit logs first because of onDelete: Restrict.
        await prisma.bookLifecycleLog.deleteMany({
          where: { bookId: createdBookId },
        });

        // Permanently remove the test book.
        await prisma.book.deleteMany({
          where: { id: createdBookId },
        });
      }
    } finally {
      await app?.close();
    }
  });

  // ==========================================
  // CREATE
  // ==========================================

  describe('POST /books', () => {
    it('should create a book', async () => {
      const response = await request(app.getHttpServer())
        .post('/books')
        .send(testBook)
        .expect(201);

      expect(response.body.title).toBe(testBook.title);
      expect(response.body.author).toBe(testBook.author);
      expect(response.body.isbn).toBe(testBook.isbn);
      expect(response.body.status).toBe('ACTIVE');

      createdBookId = response.body.id;
    });

    it('should reject duplicate ISBN', async () => {
      await request(app.getHttpServer())
        .post('/books')
        .send(testBook)
        .expect(409);
    });
  });

  // ==========================================
  // READ
  // ==========================================

  describe('GET /books', () => {
    it('should return books', async () => {
      const response = await request(app.getHttpServer())
        .get('/books')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      expect(
        response.body.some((book: { id: string }) => book.id === createdBookId),
      ).toBe(true);
    });
  });

  describe('GET /books/:id', () => {
    it('should return a book by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/books/${createdBookId}`)
        .expect(200);

      expect(response.body.id).toBe(createdBookId);
      expect(response.body.title).toBe(testBook.title);
    });

    it('should return 404 for a missing book', async () => {
      await request(app.getHttpServer())
        .get('/books/non-existing-id')
        .expect(404);
    });
  });

  // ==========================================
  // UPDATE
  // ==========================================

  describe('PATCH /books/:id', () => {
    it('should update a book', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/books/${createdBookId}`)
        .send({ title: 'Atomic Habits Updated' })
        .expect(200);

      expect(response.body.title).toBe('Atomic Habits Updated');
    });
  });

  // ==========================================
  // ARCHIVE
  // ==========================================

  describe('PATCH /books/:id/archive', () => {
    it('should archive a book', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/books/${createdBookId}/archive`)
        .send({ reason: 'Not currently in use' })
        .expect(200);

      expect(response.body.status).toBe('ARCHIVED');
    });
  });

  // ==========================================
  // UNARCHIVE
  // ==========================================

  describe('PATCH /books/:id/unarchive', () => {
    it('should unarchive a book', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/books/${createdBookId}/unarchive`)
        .send({ reason: 'Available again' })
        .expect(200);

      expect(response.body.status).toBe('ACTIVE');
    });
  });

  // ==========================================
  // AUDIT LOGS
  // ==========================================

  describe('GET /books/:id/lifecycle-logs', () => {
    it('should return lifecycle logs', async () => {
      const response = await request(app.getHttpServer())
        .get(`/books/${createdBookId}/lifecycle-logs`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      const actions = response.body.map(
        (log: { action: string }) => log.action,
      );

      expect(actions).toContain('CREATED');
      expect(actions).toContain('ARCHIVED');
      expect(actions).toContain('UNARCHIVED');
    });
  });

  // ==========================================
  // DELETE (SOFT DELETE)
  // ==========================================

  describe('DELETE /books/:id', () => {
    it('should soft delete a book', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/books/${createdBookId}`)
        .send({ reason: 'E2E test deletion' })
        .expect(200);

      expect(response.body.status).toBe('DELETED');
    });
  });

  // ==========================================
  // RESTORE
  // ==========================================

  describe('PATCH /books/:id/restore', () => {
    it('should restore a deleted book', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/books/${createdBookId}/restore`)
        .send({ reason: 'E2E test restoration' })
        .expect(200);

      expect(response.body.status).toBe('ACTIVE');
    });
  });
});
