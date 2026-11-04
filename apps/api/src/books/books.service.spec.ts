import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BooksService } from './books.service.js';

describe('BooksService', () => {
  let service: BooksService;

  const mockPrismaService = {
    book: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    bookLifecycleLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const existingBook = {
    id: 'book-001',
    title: 'Atomic Habits',
    author: 'James Clear',
    isbn: '9780735211292',
    status: 'ACTIVE',
    statusBeforeDelete: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    mockPrismaService.$transaction.mockImplementation(
      async (callback: (tx: typeof mockPrismaService) => Promise<unknown>) =>
        callback(mockPrismaService),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
  });

  // ==========================================
  // Create
  // ==========================================

  describe('create', () => {
    it('should create a book and record CREATED log', async () => {
      const input = {
        title: 'Atomic Habits',
        author: 'James Clear',
      };

      mockPrismaService.book.create.mockResolvedValue(existingBook);

      await expect(service.create(input)).resolves.toEqual(existingBook);

      expect(mockPrismaService.book.create).toHaveBeenCalledWith({
        data: input,
      });

      expect(mockPrismaService.bookLifecycleLog.create).toHaveBeenCalledWith({
        data: {
          bookId: 'book-001',
          action: 'CREATED',
          previousStatus: null,
          newStatus: 'ACTIVE',
        },
      });

      expect(mockPrismaService.$transaction).toHaveBeenCalledOnce();
    });

    it('should throw ConflictException when ISBN already exists', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue(existingBook);

      await expect(
        service.create({
          title: 'Another Book',
          isbn: '9780735211292',
        }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrismaService.book.create).not.toHaveBeenCalled();
      expect(mockPrismaService.bookLifecycleLog.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when Prisma detects duplicate ISBN', async () => {
      mockPrismaService.book.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '7.10.1',
        }),
      );

      await expect(
        service.create({
          title: 'Another Book',
          isbn: '9780735211292',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should rollback when CREATED audit log fails', async () => {
      mockPrismaService.book.create.mockResolvedValue(existingBook);
      mockPrismaService.bookLifecycleLog.create.mockRejectedValue(
        new Error('Audit log failed'),
      );

      await expect(service.create({ title: 'Atomic Habits' })).rejects.toThrow(
        'Audit log failed',
      );

      expect(mockPrismaService.$transaction).toHaveBeenCalledOnce();
    });
  });

  // ==========================================
  // Read
  // ==========================================

  describe('read', () => {
    it('should return all books', async () => {
      mockPrismaService.book.findMany.mockResolvedValue([existingBook]);

      await expect(service.findAll()).resolves.toEqual([existingBook]);

      expect(mockPrismaService.book.findMany).toHaveBeenCalledOnce();
    });

    it('should return a book by ID', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue(existingBook);

      await expect(service.findOne('book-001')).resolves.toEqual(existingBook);
    });

    it('should throw NotFoundException when book does not exist', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue(null);

      await expect(service.findOne('book-999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return lifecycle logs', async () => {
      const logs = [
        {
          id: 'log-001',
          bookId: 'book-001',
          action: 'CREATED',
          previousStatus: null,
          newStatus: 'ACTIVE',
        },
      ];

      mockPrismaService.book.findUnique.mockResolvedValue(existingBook);
      mockPrismaService.bookLifecycleLog.findMany.mockResolvedValue(logs);

      await expect(service.getLifecycleLogs('book-001')).resolves.toEqual(logs);

      expect(mockPrismaService.bookLifecycleLog.findMany).toHaveBeenCalledWith({
        where: { bookId: 'book-001' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ==========================================
  // Update
  // ==========================================

  describe('update', () => {
    it('should update a book', async () => {
      const updatedBook = {
        ...existingBook,
        title: 'Updated Title',
      };

      mockPrismaService.book.findUnique.mockResolvedValue(existingBook);
      mockPrismaService.book.update.mockResolvedValue(updatedBook);

      await expect(
        service.update('book-001', { title: 'Updated Title' }),
      ).resolves.toEqual(updatedBook);

      expect(mockPrismaService.book.update).toHaveBeenCalledWith({
        where: { id: 'book-001' },
        data: { title: 'Updated Title' },
      });
    });

    it('should throw NotFoundException when updating non-existing book', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue(null);

      await expect(
        service.update('book-999', { title: 'Updated Title' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when updating deleted book', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue({
        ...existingBook,
        status: 'DELETED',
      });

      await expect(
        service.update('book-001', { title: 'Updated Title' }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrismaService.book.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when ISBN already exists', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue(existingBook);
      mockPrismaService.book.findFirst.mockResolvedValue({
        ...existingBook,
        id: 'book-002',
      });

      await expect(
        service.update('book-001', { isbn: '9780735211292' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when Prisma detects duplicate ISBN', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue(existingBook);
      mockPrismaService.book.findFirst.mockResolvedValue(null);

      mockPrismaService.book.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '7.10.1',
        }),
      );

      await expect(
        service.update('book-001', { isbn: '9780735211292' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ==========================================
  // Archive / Unarchive
  // ==========================================

  describe('archive', () => {
    it('should archive an active book and record audit log', async () => {
      const archivedBook = {
        ...existingBook,
        status: 'ARCHIVED',
      };

      mockPrismaService.book.findUnique.mockResolvedValue({
        status: 'ACTIVE',
      });
      mockPrismaService.book.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.book.findUniqueOrThrow.mockResolvedValue(archivedBook);

      await expect(
        service.archive('book-001', { reason: 'Not currently in use' }),
      ).resolves.toEqual(archivedBook);

      expect(mockPrismaService.book.updateMany).toHaveBeenCalledWith({
        where: { id: 'book-001', status: 'ACTIVE' },
        data: { status: 'ARCHIVED' },
      });

      expect(mockPrismaService.bookLifecycleLog.create).toHaveBeenCalledWith({
        data: {
          bookId: 'book-001',
          action: 'ARCHIVED',
          previousStatus: 'ACTIVE',
          newStatus: 'ARCHIVED',
          reason: 'Not currently in use',
        },
      });
    });

    it('should reject archiving an already archived book', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue({
        status: 'ARCHIVED',
      });

      await expect(service.archive('book-001', {})).rejects.toThrow(
        ConflictException,
      );

      expect(mockPrismaService.book.updateMany).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for missing book', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue(null);

      await expect(service.archive('book-999', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('unarchive', () => {
    it('should unarchive an archived book', async () => {
      const activeBook = {
        ...existingBook,
        status: 'ACTIVE',
      };

      mockPrismaService.book.findUnique.mockResolvedValue({
        status: 'ARCHIVED',
      });
      mockPrismaService.book.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.book.findUniqueOrThrow.mockResolvedValue(activeBook);

      await expect(service.unarchive('book-001', {})).resolves.toEqual(
        activeBook,
      );

      expect(mockPrismaService.bookLifecycleLog.create).toHaveBeenCalledWith({
        data: {
          bookId: 'book-001',
          action: 'UNARCHIVED',
          previousStatus: 'ARCHIVED',
          newStatus: 'ACTIVE',
          reason: null,
        },
      });
    });

    it('should reject unarchiving an active book', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue({
        status: 'ACTIVE',
      });

      await expect(service.unarchive('book-001', {})).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ==========================================
  // Delete
  // ==========================================

  describe('remove', () => {
    it('should soft delete an active book with a reason', async () => {
      const deletedBook = {
        ...existingBook,
        status: 'DELETED',
        statusBeforeDelete: 'ACTIVE',
        deletedAt: new Date(),
      };

      mockPrismaService.book.findUnique.mockResolvedValue({
        status: 'ACTIVE',
      });
      mockPrismaService.book.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.book.findUniqueOrThrow.mockResolvedValue(deletedBook);

      await expect(
        service.remove('book-001', { reason: 'Duplicate book' }),
      ).resolves.toEqual(deletedBook);

      expect(mockPrismaService.book.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'book-001',
          status: 'ACTIVE',
        },
        data: {
          status: 'DELETED',
          deletedAt: expect.any(Date),
          statusBeforeDelete: 'ACTIVE',
        },
      });

      expect(mockPrismaService.bookLifecycleLog.create).toHaveBeenCalledWith({
        data: {
          bookId: 'book-001',
          action: 'DELETED',
          previousStatus: 'ACTIVE',
          newStatus: 'DELETED',
          reason: 'Duplicate book',
        },
      });
    });

    it('should soft delete an active book without a reason', async () => {
      const deletedBook = {
        ...existingBook,
        status: 'DELETED',
        statusBeforeDelete: 'ACTIVE',
        deletedAt: new Date(),
      };

      mockPrismaService.book.findUnique.mockResolvedValue({
        status: 'ACTIVE',
      });
      mockPrismaService.book.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.book.findUniqueOrThrow.mockResolvedValue(deletedBook);

      await expect(service.remove('book-001', {})).resolves.toEqual(
        deletedBook,
      );

      expect(mockPrismaService.book.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'book-001',
          status: 'ACTIVE',
        },
        data: {
          status: 'DELETED',
          deletedAt: expect.any(Date),
          statusBeforeDelete: 'ACTIVE',
        },
      });

      expect(mockPrismaService.bookLifecycleLog.create).toHaveBeenCalledWith({
        data: {
          bookId: 'book-001',
          action: 'DELETED',
          previousStatus: 'ACTIVE',
          newStatus: 'DELETED',
          reason: null,
        },
      });
    });

    it('should delete an archived book and remember its previous status', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue({
        status: 'ARCHIVED',
      });
      mockPrismaService.book.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.book.findUniqueOrThrow.mockResolvedValue({
        ...existingBook,
        status: 'DELETED',
        statusBeforeDelete: 'ARCHIVED',
      });

      await service.remove('book-001', {});

      expect(mockPrismaService.book.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'book-001',
          status: 'ARCHIVED',
        },
        data: {
          status: 'DELETED',
          deletedAt: expect.any(Date),
          statusBeforeDelete: 'ARCHIVED',
        },
      });
    });

    it('should throw NotFoundException when book does not exist', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue(null);

      await expect(service.remove('book-999', {})).rejects.toThrow(
        NotFoundException,
      );

      expect(mockPrismaService.book.updateMany).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when book is already deleted', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue({
        status: 'DELETED',
      });

      await expect(service.remove('book-001', {})).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ==========================================
  // Restore
  // ==========================================

  describe('restore', () => {
    it('should restore a deleted book to ACTIVE', async () => {
      const restoredBook = {
        ...existingBook,
        status: 'ACTIVE',
        deletedAt: null,
        statusBeforeDelete: null,
      };

      mockPrismaService.book.findUnique.mockResolvedValue({
        status: 'DELETED',
        statusBeforeDelete: 'ACTIVE',
      });
      mockPrismaService.book.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.book.findUniqueOrThrow.mockResolvedValue(restoredBook);

      await expect(
        service.restore('book-001', { reason: 'Mistaken deletion' }),
      ).resolves.toEqual(restoredBook);

      expect(mockPrismaService.book.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'book-001',
          status: 'DELETED',
          statusBeforeDelete: 'ACTIVE',
        },
        data: {
          status: 'ACTIVE',
          deletedAt: null,
          statusBeforeDelete: null,
        },
      });

      expect(mockPrismaService.bookLifecycleLog.create).toHaveBeenCalledWith({
        data: {
          bookId: 'book-001',
          action: 'RESTORED',
          previousStatus: 'DELETED',
          newStatus: 'ACTIVE',
          reason: 'Mistaken deletion',
        },
      });
    });

    it('should restore a deleted book to ARCHIVED', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue({
        status: 'DELETED',
        statusBeforeDelete: 'ARCHIVED',
      });
      mockPrismaService.book.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.book.findUniqueOrThrow.mockResolvedValue({
        ...existingBook,
        status: 'ARCHIVED',
        deletedAt: null,
        statusBeforeDelete: null,
      });

      await service.restore('book-001', {});

      expect(mockPrismaService.bookLifecycleLog.create).toHaveBeenCalledWith({
        data: {
          bookId: 'book-001',
          action: 'RESTORED',
          previousStatus: 'DELETED',
          newStatus: 'ARCHIVED',
          reason: null,
        },
      });
    });

    it('should reject restoring a non-deleted book', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue({
        status: 'ACTIVE',
        statusBeforeDelete: null,
      });

      await expect(service.restore('book-001', {})).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException when book does not exist', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue(null);

      await expect(service.restore('book-999', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject restoring when previous status is invalid', async () => {
      mockPrismaService.book.findUnique.mockResolvedValue({
        status: 'DELETED',
        statusBeforeDelete: null,
      });

      await expect(service.restore('book-001', {})).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
