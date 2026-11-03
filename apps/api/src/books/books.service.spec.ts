import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { BooksService } from './books.service.js';

describe('BooksService', () => {
  let service: BooksService;

  const mockPrismaService = {
    book: {
      findMany: vi.fn(),
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
});
