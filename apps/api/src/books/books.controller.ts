import {
  bookSchema,
  createBookSchema,
  type CreateBookDto,
} from '@atoz/schemas';
import { Body, Controller, Get, Param, Post, UsePipes } from '@nestjs/common';
import { ApiNotFoundResponse } from '@nestjs/swagger';
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

  @Get(':id')
  @ApiZodResponse(200, bookSchema, 'Book retrieved successfully')
  @ApiNotFoundResponse({ description: 'Book not found' })
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @Post()
  @ApiZodBody(createBookSchema)
  @ApiZodResponse(201, bookSchema, 'Book created successfully')
  @UsePipes(new ZodValidationPipe(createBookSchema))
  create(@Body() data: CreateBookDto) {
    return this.booksService.create(data);
  }
}
