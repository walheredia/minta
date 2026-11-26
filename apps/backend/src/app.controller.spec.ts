import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: { $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]) },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('reports the database as up', async () => {
      await expect(appController.getHealth()).resolves.toEqual({
        status: 'ok',
        database: 'up',
      });
    });
  });
});
