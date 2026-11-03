import {
  bookSchema,
  createBookSchema,
  updateBookSchema,
  type CreateBookDto,
  type UpdateBookDto,
} from '@atoz/schemas';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common';
import { ApiConflictResponse, ApiNotFoundResponse } from '@nestjs/swagger';
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
  @ApiConflictResponse({ description: 'ISBN already exists' })
  @UsePipes(new ZodValidationPipe(createBookSchema))
  create(@Body() data: CreateBookDto) {
    return this.booksService.create(data);
  }

  @Patch(':id')
  @ApiZodBody(updateBookSchema)
  @ApiZodResponse(200, bookSchema, 'Book updated successfully')
  @ApiNotFoundResponse({ description: 'Book not found' })
  @ApiConflictResponse({ description: 'ISBN already exists' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBookSchema)) data: UpdateBookDto,
  ) {
    return this.booksService.update(id, data);
  }
}
