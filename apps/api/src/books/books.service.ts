import type { CreateBookDto, UpdateBookDto } from '@atoz/schemas';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateBookDto) {
    if (data.isbn) {
      const existingBook = await this.prisma.book.findUnique({
        where: { isbn: data.isbn },
      });

      if (existingBook) {
        throw new ConflictException('ISBN already exists');
      }
    }

    try {
      return await this.prisma.book.create({
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('ISBN already exists');
      }

      throw error;
    }
  }

  async findAll() {
    return this.prisma.book.findMany();
  }

  async findOne(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }

  async update(id: string, data: UpdateBookDto) {
    await this.findOne(id);

    if (data.isbn) {
      const existingBook = await this.prisma.book.findFirst({
        where: {
          isbn: data.isbn,
          id: { not: id },
        },
      });

      if (existingBook) {
        throw new ConflictException('ISBN already exists');
      }
    }

    try {
      return await this.prisma.book.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('ISBN already exists');
      }

      throw error;
    }
  }
}
