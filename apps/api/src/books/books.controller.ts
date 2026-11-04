import {
  bookLifecycleLogSchema,
  bookLifecycleReasonSchema,
  bookSchema,
  createBookSchema,
  deleteBookSchema,
  updateBookSchema,
  type BookLifecycleReasonDto,
  type CreateBookDto,
  type DeleteBookDto,
  type UpdateBookDto,
} from '@atoz/schemas';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { z } from 'zod';
import { ApiZodBody } from '../common/decorators/api-zod-body.decorator.js';
import { ApiZodResponse } from '../common/decorators/api-zod-response.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { BooksService } from './books.service.js';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  // Read
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

  @Get(':id/lifecycle-logs')
  @ApiZodResponse(
    200,
    z.array(bookLifecycleLogSchema),
    'Book audit logs retrieved successfully',
  )
  @ApiNotFoundResponse({ description: 'Book not found' })
  getLifecycleLogs(@Param('id') id: string) {
    return this.booksService.getLifecycleLogs(id);
  }

  // Create
  @Post()
  @ApiZodBody(createBookSchema)
  @ApiBadRequestResponse({
    description: 'Invalid request body',
  })
  @ApiZodResponse(201, bookSchema, 'Book created successfully', {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    title: 'Atomic Habits',
    author: 'James Clear',
    isbn: '9780735211292',
    status: 'ACTIVE',
    deletedAt: null,
    statusBeforeDelete: null,
    createdAt: '2026-11-04T06:30:50.601Z',
    updatedAt: '2026-11-04T06:30:50.601Z',
  })
  @ApiConflictResponse({ description: 'ISBN already exists' })
  create(
    @Body(new ZodValidationPipe(createBookSchema))
    data: CreateBookDto,
  ) {
    return this.booksService.create(data);
  }

  // Update
  @Patch(':id')
  @ApiZodBody(updateBookSchema)
  @ApiBadRequestResponse({
    description: 'Invalid request body',
  })
  @ApiZodResponse(200, bookSchema, 'Book updated successfully', {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    title: 'Happy',
    author: 'George Orwell',
    isbn: '9780451524935',
    status: 'ACTIVE',
    deletedAt: null,
    statusBeforeDelete: null,
    createdAt: '2026-11-04T06:30:50.601Z',
    updatedAt: '2026-11-04T06:40:50.601Z',
  })
  @ApiNotFoundResponse({ description: 'Book not found' })
  @ApiConflictResponse({
    description: 'ISBN already exists or book is deleted',
  })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBookSchema))
    data: UpdateBookDto,
  ) {
    return this.booksService.update(id, data);
  }

  // Archive
  @Patch(':id/archive')
  @ApiZodBody(bookLifecycleReasonSchema)
  @ApiBadRequestResponse({
    description: 'Invalid request body',
  })
  @ApiZodResponse(200, bookSchema, 'Book archived successfully')
  @ApiNotFoundResponse({ description: 'Book not found' })
  @ApiConflictResponse({ description: 'Book cannot be archived' })
  archive(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(bookLifecycleReasonSchema))
    data: BookLifecycleReasonDto,
  ) {
    return this.booksService.archive(id, data);
  }

  // Unarchive
  @Patch(':id/unarchive')
  @ApiZodBody(bookLifecycleReasonSchema)
  @ApiBadRequestResponse({
    description: 'Invalid request body',
  })
  @ApiZodResponse(200, bookSchema, 'Book unarchived successfully')
  @ApiNotFoundResponse({ description: 'Book not found' })
  @ApiConflictResponse({ description: 'Book cannot be unarchived' })
  unarchive(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(bookLifecycleReasonSchema))
    data: BookLifecycleReasonDto,
  ) {
    return this.booksService.unarchive(id, data);
  }

  // Delete
  @Delete(':id')
  @ApiZodBody(deleteBookSchema)
  @ApiBadRequestResponse({
    description: 'Invalid request body',
  })
  @ApiZodResponse(200, bookSchema, 'Book deleted successfully')
  @ApiNotFoundResponse({ description: 'Book not found' })
  @ApiConflictResponse({ description: 'Book has already been deleted' })
  remove(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(deleteBookSchema))
    data: DeleteBookDto,
  ) {
    return this.booksService.remove(id, data);
  }

  // Restore
  @Patch(':id/restore')
  @ApiZodBody(bookLifecycleReasonSchema)
  @ApiBadRequestResponse({
    description: 'Invalid request body',
  })
  @ApiZodResponse(200, bookSchema, 'Book restored successfully')
  @ApiNotFoundResponse({ description: 'Book not found' })
  @ApiConflictResponse({ description: 'Book cannot be restored' })
  restore(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(bookLifecycleReasonSchema))
    data: BookLifecycleReasonDto,
  ) {
    return this.booksService.restore(id, data);
  }
}
