import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { BooksService } from './books.service.js';

describe('BooksService', () => {
  let service: BooksService;

  const mockPrismaService = {
    book: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
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
});
