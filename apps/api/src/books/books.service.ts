import type {
  BookLifecycleAction,
  BookLifecycleReasonDto,
  BookStatus,
  CreateBookDto,
  UpdateBookDto,
} from '@atoz/schemas';
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

  // ==========================================
  // Create
  // ==========================================

  async create(data: CreateBookDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (data.isbn) {
          const existingBook = await tx.book.findUnique({
            where: { isbn: data.isbn },
          });

          if (existingBook) {
            throw new ConflictException('ISBN already exists');
          }
        }

        const book = await tx.book.create({
          data,
        });

        await tx.bookLifecycleLog.create({
          data: {
            bookId: book.id,
            action: 'CREATED',
            previousStatus: null,
            newStatus: 'ACTIVE',
          },
        });

        return book;
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

  // ==========================================
  // Read
  // ==========================================

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

  async getLifecycleLogs(id: string) {
    await this.findOne(id);

    return this.prisma.bookLifecycleLog.findMany({
      where: {
        bookId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ==========================================
  // Update
  // ==========================================

  async update(id: string, data: UpdateBookDto) {
    const book = await this.findOne(id);

    if (book.status === 'DELETED') {
      throw new ConflictException('Cannot update a deleted book');
    }

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

  // ==========================================
  // Archive / Unarchive
  // ==========================================

  private async changeStatus(
    id: string,
    expectedStatus: BookStatus,
    newStatus: BookStatus,
    action: BookLifecycleAction,
    data: BookLifecycleReasonDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const book = await tx.book.findUnique({
        where: { id },
        select: { status: true },
      });

      if (!book) {
        throw new NotFoundException(`Book with ID ${id} not found`);
      }

      if (book.status !== expectedStatus) {
        throw new ConflictException(
          `Cannot ${action.toLowerCase()} a book with status ${book.status}`,
        );
      }

      const result = await tx.book.updateMany({
        where: {
          id,
          status: expectedStatus,
        },
        data: {
          status: newStatus,
        },
      });

      if (result.count === 0) {
        throw new ConflictException(
          'Book status has changed. Please try again.',
        );
      }

      await tx.bookLifecycleLog.create({
        data: {
          bookId: id,
          action,
          previousStatus: expectedStatus,
          newStatus,
          reason: data.reason ?? null,
        },
      });

      return tx.book.findUniqueOrThrow({
        where: { id },
      });
    });
  }

  async archive(id: string, data: BookLifecycleReasonDto) {
    return this.changeStatus(id, 'ACTIVE', 'ARCHIVED', 'ARCHIVED', data);
  }

  async unarchive(id: string, data: BookLifecycleReasonDto) {
    return this.changeStatus(id, 'ARCHIVED', 'ACTIVE', 'UNARCHIVED', data);
  }

  // ==========================================
  // Delete
  // ==========================================

  async remove(id: string, data: BookLifecycleReasonDto) {
    return this.prisma.$transaction(async (tx) => {
      const book = await tx.book.findUnique({
        where: { id },
        select: {
          status: true,
        },
      });

      if (!book) {
        throw new NotFoundException(`Book with ID ${id} not found`);
      }

      if (book.status !== 'ACTIVE' && book.status !== 'ARCHIVED') {
        throw new ConflictException('Book has already been deleted');
      }

      const previousStatus = book.status;
      const deletedAt = new Date();

      const result = await tx.book.updateMany({
        where: {
          id,
          status: previousStatus,
        },
        data: {
          status: 'DELETED',
          deletedAt,
          statusBeforeDelete: previousStatus,
        },
      });

      if (result.count === 0) {
        throw new ConflictException(
          'Book status has changed. Please try again.',
        );
      }

      await tx.bookLifecycleLog.create({
        data: {
          bookId: id,
          action: 'DELETED',
          previousStatus,
          newStatus: 'DELETED',
          reason: data.reason ?? null,
        },
      });

      return tx.book.findUniqueOrThrow({
        where: { id },
      });
    });
  }

  // ==========================================
  // Restore
  // ==========================================

  async restore(id: string, data: BookLifecycleReasonDto) {
    return this.prisma.$transaction(async (tx) => {
      const book = await tx.book.findUnique({
        where: { id },
        select: {
          status: true,
          statusBeforeDelete: true,
        },
      });

      if (!book) {
        throw new NotFoundException(`Book with ID ${id} not found`);
      }

      if (book.status !== 'DELETED') {
        throw new ConflictException('Only deleted books can be restored');
      }

      const previousStatus = book.statusBeforeDelete;

      if (previousStatus !== 'ACTIVE' && previousStatus !== 'ARCHIVED') {
        throw new ConflictException(
          'Cannot restore book: previous status is invalid',
        );
      }

      const result = await tx.book.updateMany({
        where: {
          id,
          status: 'DELETED',
          statusBeforeDelete: previousStatus,
        },
        data: {
          status: previousStatus,
          deletedAt: null,
          statusBeforeDelete: null,
        },
      });

      if (result.count === 0) {
        throw new ConflictException(
          'Book status has changed. Please try again.',
        );
      }

      await tx.bookLifecycleLog.create({
        data: {
          bookId: id,
          action: 'RESTORED',
          previousStatus: 'DELETED',
          newStatus: previousStatus,
          reason: data.reason ?? null,
        },
      });

      return tx.book.findUniqueOrThrow({
        where: { id },
      });
    });
  }
}
