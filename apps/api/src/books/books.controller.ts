import {
  bookSchema,
  createBookSchema,
  type CreateBookDto,
} from '@atoz/schemas';
import { Body, Controller, Get, Post, UsePipes } from '@nestjs/common';
import { z } from 'zod';
import { ApiZodBody } from '../common/decorators/api-zod-body.decorator.js';
import { ApiZodResponse } from '../common/decorators/api-zod-response.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { BooksService } from './books.service.js';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @ApiZodResponse(200, z.array(bookSchema), 'Book list retrieved successfully')
  findAll() {
    return this.booksService.findAll();
  }

  @Post()
  @ApiZodBody(createBookSchema)
  @ApiZodResponse(201, bookSchema, 'Book created successfully')
  @UsePipes(new ZodValidationPipe(createBookSchema))
  create(@Body() data: CreateBookDto) {
    return this.booksService.create(data);
  }
}
