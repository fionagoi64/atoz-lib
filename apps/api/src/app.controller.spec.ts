import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  const mockAppService = {
    getBooks: vi.fn().mockResolvedValue([
      {
        id: 'book-001',
        title: 'Atomic Habits',
      },
    ]),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should return books', async () => {
    await expect(appController.getBooks()).resolves.toEqual([
      {
        id: 'book-001',
        title: 'Atomic Habits',
      },
    ]);
  });
});
