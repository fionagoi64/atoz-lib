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
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

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

  it('should return all books', async () => {
    const books = [{ id: 'book-001', title: 'Atomic Habits' }];

    mockPrismaService.book.findMany.mockResolvedValue(books);

    await expect(service.findAll()).resolves.toEqual(books);
    expect(mockPrismaService.book.findMany).toHaveBeenCalledOnce();
  });

  it('should create a book', async () => {
    const input = {
      title: 'Atomic Habits',
      author: 'James Clear',
    };

    const createdBook = {
      id: 'book-001',
      ...input,
    };

    mockPrismaService.book.create.mockResolvedValue(createdBook);

    await expect(service.create(input)).resolves.toEqual(createdBook);

    expect(mockPrismaService.book.create).toHaveBeenCalledWith({
      data: input,
    });
  });

  it('should return a book by ID', async () => {
    const book = {
      id: 'book-001',
      title: 'Atomic Habits',
    };

    mockPrismaService.book.findUnique.mockResolvedValue(book);

    await expect(service.findOne('book-001')).resolves.toEqual(book);

    expect(mockPrismaService.book.findUnique).toHaveBeenCalledWith({
      where: { id: 'book-001' },
    });
  });

  it('should throw NotFoundException when book does not exist', async () => {
    mockPrismaService.book.findUnique.mockResolvedValue(null);

    await expect(service.findOne('book-999')).rejects.toThrow(
      NotFoundException,
    );

    expect(mockPrismaService.book.findUnique).toHaveBeenCalledWith({
      where: { id: 'book-999' },
    });
  });

  it('should update a book', async () => {
    const existingBook = {
      id: 'book-001',
      title: 'Atomic Habits',
      author: 'James Clear',
      isbn: '9780735211292',
    };

    const input = {
      title: 'Atomic Habits - Updated',
    };

    const updatedBook = {
      ...existingBook,
      ...input,
    };

    mockPrismaService.book.findUnique.mockResolvedValue(existingBook);
    mockPrismaService.book.update.mockResolvedValue(updatedBook);

    await expect(service.update('book-001', input)).resolves.toEqual(
      updatedBook,
    );

    expect(mockPrismaService.book.update).toHaveBeenCalledWith({
      where: { id: 'book-001' },
      data: input,
    });
  });

  it('should throw NotFoundException when updating a non-existing book', async () => {
    mockPrismaService.book.findUnique.mockResolvedValue(null);

    await expect(
      service.update('book-999', { title: 'Updated Title' }),
    ).rejects.toThrow(NotFoundException);

    expect(mockPrismaService.book.update).not.toHaveBeenCalled();
  });

  it('should throw ConflictException when ISBN already exists', async () => {
    const existingBook = {
      id: 'book-001',
      title: 'Atomic Habits',
      isbn: '9780735211292',
    };

    mockPrismaService.book.findUnique.mockResolvedValue(existingBook);
    mockPrismaService.book.findFirst.mockResolvedValue({
      id: 'book-002',
      title: 'Another Book',
      isbn: '9780735211292',
    });

    await expect(
      service.update('book-001', {
        isbn: '9780735211292',
      }),
    ).rejects.toThrow(ConflictException);

    expect(mockPrismaService.book.update).not.toHaveBeenCalled();
  });

  it('should throw ConflictException when creating a book with existing ISBN', async () => {
    mockPrismaService.book.findUnique.mockResolvedValue({
      id: 'book-001',
      title: 'Atomic Habits',
      isbn: '9780735211292',
    });

    await expect(
      service.create({
        title: 'Another Book',
        isbn: '9780735211292',
      }),
    ).rejects.toThrow(ConflictException);

    expect(mockPrismaService.book.create).not.toHaveBeenCalled();
  });

  it('should throw ConflictException when Prisma detects duplicate ISBN', async () => {
    mockPrismaService.book.findUnique.mockResolvedValue(null);

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

  it('should throw ConflictException when updating with duplicate ISBN from Prisma', async () => {
    mockPrismaService.book.findUnique.mockResolvedValue({
      id: 'book-001',
      title: 'Atomic Habits',
    });

    mockPrismaService.book.findFirst.mockResolvedValue(null);

    mockPrismaService.book.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.1',
      }),
    );

    await expect(
      service.update('book-001', {
        isbn: '9780735211292',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
