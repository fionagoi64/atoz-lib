import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BooksController } from './books.controller.js';
import { BooksService } from './books.service.js';

describe('BooksController', () => {
  let controller: BooksController;

  const mockBooksService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    getLifecycleLogs: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    unarchive: vi.fn(),
    remove: vi.fn(),
    restore: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [
        {
          provide: BooksService,
          useValue: mockBooksService,
        },
      ],
    }).compile();

    controller = module.get<BooksController>(BooksController);
  });

  // ==========================================
  // Read
  // ==========================================

  describe('findAll', () => {
    it('should return all books', async () => {
      const books = [{ id: 'book-001', title: 'Atomic Habits' }];

      mockBooksService.findAll.mockResolvedValue(books);

      await expect(controller.findAll()).resolves.toEqual(books);
      expect(mockBooksService.findAll).toHaveBeenCalledOnce();
    });
  });

  describe('findOne', () => {
    it('should return a book by ID', async () => {
      const book = {
        id: 'book-001',
        title: 'Atomic Habits',
      };

      mockBooksService.findOne.mockResolvedValue(book);

      await expect(controller.findOne('book-001')).resolves.toEqual(book);
      expect(mockBooksService.findOne).toHaveBeenCalledWith('book-001');
    });
  });

  describe('getLifecycleLogs', () => {
    it('should return lifecycle logs for a book', async () => {
      const logs = [
        {
          id: 'log-001',
          bookId: 'book-001',
          action: 'CREATED',
          previousStatus: null,
          newStatus: 'ACTIVE',
          reason: null,
          adminId: null,
          createdAt: new Date().toISOString(),
        },
      ];

      mockBooksService.getLifecycleLogs.mockResolvedValue(logs);

      await expect(controller.getLifecycleLogs('book-001')).resolves.toEqual(
        logs,
      );

      expect(mockBooksService.getLifecycleLogs).toHaveBeenCalledWith(
        'book-001',
      );
    });
  });

  // ==========================================
  // Create
  // ==========================================

  describe('create', () => {
    it('should create a book', async () => {
      const input = {
        title: 'Atomic Habits',
        author: 'James Clear',
      };

      const createdBook = {
        id: 'book-001',
        ...input,
      };

      mockBooksService.create.mockResolvedValue(createdBook);

      await expect(controller.create(input)).resolves.toEqual(createdBook);
      expect(mockBooksService.create).toHaveBeenCalledWith(input);
    });
  });

  // ==========================================
  // Update
  // ==========================================

  describe('update', () => {
    it('should update a book', async () => {
      const input = {
        title: 'Atomic Habits - Updated',
      };

      const updatedBook = {
        id: 'book-001',
        title: 'Atomic Habits - Updated',
      };

      mockBooksService.update.mockResolvedValue(updatedBook);

      await expect(controller.update('book-001', input)).resolves.toEqual(
        updatedBook,
      );

      expect(mockBooksService.update).toHaveBeenCalledWith('book-001', input);
    });
  });

  // ==========================================
  // Archive
  // ==========================================

  describe('archive', () => {
    it('should archive a book', async () => {
      const input = { reason: 'Not currently in use' };

      const archivedBook = {
        id: 'book-001',
        title: 'Atomic Habits',
        status: 'ARCHIVED',
      };

      mockBooksService.archive.mockResolvedValue(archivedBook);

      await expect(controller.archive('book-001', input)).resolves.toEqual(
        archivedBook,
      );

      expect(mockBooksService.archive).toHaveBeenCalledWith('book-001', input);
    });
  });

  // ==========================================
  // Unarchive
  // ==========================================

  describe('unarchive', () => {
    it('should unarchive a book', async () => {
      const input = { reason: 'Book is available again' };

      const activeBook = {
        id: 'book-001',
        title: 'Atomic Habits',
        status: 'ACTIVE',
      };

      mockBooksService.unarchive.mockResolvedValue(activeBook);

      await expect(controller.unarchive('book-001', input)).resolves.toEqual(
        activeBook,
      );

      expect(mockBooksService.unarchive).toHaveBeenCalledWith(
        'book-001',
        input,
      );
    });
  });

  // ==========================================
  // Delete
  // ==========================================

  describe('remove', () => {
    it('should soft delete a book', async () => {
      const input = { reason: 'Duplicate book' };

      const deletedBook = {
        id: 'book-001',
        title: 'Atomic Habits',
        status: 'DELETED',
      };

      mockBooksService.remove.mockResolvedValue(deletedBook);

      await expect(controller.remove('book-001', input)).resolves.toEqual(
        deletedBook,
      );

      expect(mockBooksService.remove).toHaveBeenCalledWith('book-001', input);
    });

    it('should delete a book without a reason', async () => {
      const deletedBook = {
        id: 'book-001',
        title: 'Atomic Habits',
        status: 'DELETED',
      };

      mockBooksService.remove.mockResolvedValue(deletedBook);

      await expect(controller.remove('book-001', {})).resolves.toEqual(
        deletedBook,
      );

      expect(mockBooksService.remove).toHaveBeenCalledWith('book-001', {});
    });
  });

  // ==========================================
  // Restore
  // ==========================================

  describe('restore', () => {
    it('should restore a deleted book', async () => {
      const input = { reason: 'Mistaken deletion' };

      const restoredBook = {
        id: 'book-001',
        title: 'Atomic Habits',
        status: 'ACTIVE',
      };

      mockBooksService.restore.mockResolvedValue(restoredBook);

      await expect(controller.restore('book-001', input)).resolves.toEqual(
        restoredBook,
      );

      expect(mockBooksService.restore).toHaveBeenCalledWith('book-001', input);
    });
  });
});
