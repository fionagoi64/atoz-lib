import type { CreateBookDto } from '@atoz/schemas';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateBookDto) {
    return this.prisma.book.create({
      data,
    });
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
}
