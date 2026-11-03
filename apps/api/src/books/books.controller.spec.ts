import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BooksController } from './books.controller.js';
import { BooksService } from './books.service.js';

describe('BooksController', () => {
  let controller: BooksController;

  const mockBooksService = {
    findAll: vi.fn(),
    create: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

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

  it('should return all books', async () => {
    const books = [{ id: 'book-001', title: 'Atomic Habits' }];

    mockBooksService.findAll.mockResolvedValue(books);

    await expect(controller.findAll()).resolves.toEqual(books);
    expect(mockBooksService.findAll).toHaveBeenCalledOnce();
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

    mockBooksService.create.mockResolvedValue(createdBook);

    await expect(controller.create(input)).resolves.toEqual(createdBook);
    expect(mockBooksService.create).toHaveBeenCalledWith(input);
  });
});
