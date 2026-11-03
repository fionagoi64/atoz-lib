import { Module } from '@nestjs/common';
import { BooksModule } from './books/books.module.js';

@Module({
  imports: [BooksModule],
})
export class AppModule {}
