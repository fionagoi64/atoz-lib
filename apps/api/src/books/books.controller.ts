import { createBookSchema, type CreateBookDto } from '@atoz/schemas';
import { Body, Controller, Get, Post, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { BooksService } from './books.service.js';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  findAll() {
    return this.booksService.findAll();
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createBookSchema))
  create(@Body() data: CreateBookDto) {
    return this.booksService.create(data);
  }
}
