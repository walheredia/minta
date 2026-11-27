import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { syncSystemCategories } from './../src/expense-categories/system-categories.sync.js';
import { deleteTestUsers } from './cleanup.js';

interface CategoryItem {
  id: string;
  name: string;
  source: 'SYSTEM' | 'HOUSEHOLD';
}

describe('ExpenseCategoriesController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();

    prisma = moduleFixture.get(PrismaService);
    await syncSystemCategories(prisma);
  });

  afterEach(async () => {
    await deleteTestUsers(prisma, 'categories-e2e');
    await app.close();
  });

  async function registerAndLogin(email: string) {
    const password = 'correct-horse-battery';
    await request(app.getHttpServer()).post('/api/auth/register').send({ email, password }).expect(201);
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/login').send({ email, password }).expect(200);
    return agent;
  }

  async function search(agent: ReturnType<typeof request.agent>, q: string): Promise<CategoryItem[]> {
    const response = await agent.get('/api/expense-categories').query({ q }).expect(200);
    return response.body as CategoryItem[];
  }

  describe('GET /api/expense-categories', () => {
    it('returns nothing until at least three characters are typed', async () => {
      const agent = await registerAndLogin('categories-e2e-min@example.com');

      expect(await search(agent, 'pa')).toEqual([]);
      expect(await search(agent, '  pa  ')).toEqual([]);
      expect(await search(agent, 'pan')).not.toEqual([]);
    });

    it('matches System Categories ignoring accents and capitalisation', async () => {
      const agent = await registerAndLogin('categories-e2e-accents@example.com');

      const results = await search(agent, 'PANADERIA');

      expect(results).toEqual([{ id: expect.any(String), name: 'Panadería', source: 'SYSTEM' }]);
    });

    it('matches anywhere in the name, listing prefix matches first and then alphabetically', async () => {
      const agent = await registerAndLogin('categories-e2e-order@example.com');

      expect((await search(agent, 'vehic')).map((c) => c.name)).toEqual(['Lavadero vehículo/auto']);
      expect((await search(agent, 'cuota')).map((c) => c.name)).toEqual([
        'Cuota de préstamo',
        'Cuota del auto',
        'Cuota social/Club',
        'Colegio/Cuota escolar',
      ]);
    });

    it('returns at most eight suggestions', async () => {
      const agent = await registerAndLogin('categories-e2e-cap@example.com');

      expect(await search(agent, 'ria')).toHaveLength(8);
    });

    it('returns 401 without a valid session', async () => {
      await request(app.getHttpServer()).get('/api/expense-categories').query({ q: 'pan' }).expect(401);
    });
  });

  describe('System Category catalog sync', () => {
    it('is idempotent', async () => {
      const before = await prisma.systemExpenseCategory.count();
      await syncSystemCategories(prisma);
      expect(await prisma.systemExpenseCategory.count()).toBe(before);
      expect(before).toBeGreaterThan(150);
    });
  });
});
