import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { syncSystemCategories } from './../src/expense-categories/system-categories.sync.js';
import { SYSTEM_CATEGORY_CATALOG } from './../src/expense-categories/system-categories.catalog.js';
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
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password })
      .expect(201);
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/login').send({ email, password }).expect(200);
    return agent;
  }

  async function search(
    agent: ReturnType<typeof request.agent>,
    q: string,
  ): Promise<CategoryItem[]> {
    const response = await agent
      .get('/api/expense-categories')
      .query({ q })
      .expect(200);
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
      const agent = await registerAndLogin(
        'categories-e2e-accents@example.com',
      );

      const results = await search(agent, 'PANADERIA');

      expect(results).toEqual([
        { id: expect.any(String), name: 'Panadería', source: 'SYSTEM' },
      ]);
    });

    it('matches anywhere in the name, listing prefix matches first and then alphabetically', async () => {
      const agent = await registerAndLogin('categories-e2e-order@example.com');

      expect((await search(agent, 'vehic')).map((c) => c.name)).toEqual([
        'Lavadero vehículo/auto',
      ]);
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
      await request(app.getHttpServer())
        .get('/api/expense-categories')
        .query({ q: 'pan' })
        .expect(401);
    });
  });

  describe('Household Categories', () => {
    async function createExpense(
      agent: ReturnType<typeof request.agent>,
      category: Record<string, string>,
      expectedStatus = 201,
    ) {
      const response = await agent
        .post('/api/expenses')
        .send({
          amount: 100,
          currency: 'ARS',
          category,
          occurredAt: '2026-01-10',
        })
        .expect(expectedStatus);
      return response.body;
    }

    it('creates a Household Category from a new name, tidying it up', async () => {
      const agent = await registerAndLogin('categories-e2e-new@example.com');

      const expense = await createExpense(agent, {
        source: 'NEW',
        name: '  clases   de cerámica ',
      });

      expect(expense.category).toEqual({
        id: expect.any(String),
        name: 'Clases de cerámica',
        source: 'HOUSEHOLD',
      });
      expect(await search(agent, 'ceram')).toEqual([expense.category]);
    });

    it('reuses an equivalent Household Category instead of duplicating it', async () => {
      const agent = await registerAndLogin('categories-e2e-reuse@example.com');

      const first = await createExpense(agent, {
        source: 'NEW',
        name: 'Clases de cerámica',
      });
      const second = await createExpense(agent, {
        source: 'NEW',
        name: 'CLASES DE CERAMICA',
      });

      expect(second.category).toEqual(first.category);
      expect(await search(agent, 'ceram')).toHaveLength(1);
    });

    it('reuses an equivalent System Category instead of creating a Household one', async () => {
      const agent = await registerAndLogin(
        'categories-e2e-reuse-system@example.com',
      );
      const [panaderia] = await search(agent, 'panaderia');

      const expense = await createExpense(agent, {
        source: 'NEW',
        name: 'panaderia',
      });

      expect(expense.category).toEqual(panaderia);
    });

    it('accepts a Household Category of the User Household by id, on create and update', async () => {
      const agent = await registerAndLogin('categories-e2e-by-id@example.com');
      const { category } = await createExpense(agent, {
        source: 'NEW',
        name: 'Clases de cerámica',
      });

      const expense = await createExpense(agent, {
        source: 'HOUSEHOLD',
        id: category.id,
      });
      expect(expense.category).toEqual(category);

      const patched = await agent
        .patch(`/api/expenses/${expense.id}`)
        .send({ category: { source: 'NEW', name: 'Taller de guitarra' } })
        .expect(200);
      expect(patched.body.category).toMatchObject({
        name: 'Taller de guitarra',
        source: 'HOUSEHOLD',
      });
    });

    it('keeps each Household Categories invisible and unusable to other Households', async () => {
      const owner = await registerAndLogin(
        'categories-e2e-isolation-a@example.com',
      );
      const intruder = await registerAndLogin(
        'categories-e2e-isolation-b@example.com',
      );
      const { category } = await createExpense(owner, {
        source: 'NEW',
        name: 'Clases de cerámica',
      });

      expect(await search(intruder, 'ceram')).toEqual([]);

      const rejected = await createExpense(
        intruder,
        { source: 'HOUSEHOLD', id: category.id },
        400,
      );
      expect(rejected.message).toBe('Tipo de gasto inválido.');

      const own = await createExpense(intruder, {
        source: 'NEW',
        name: 'Kiosco del club',
      });
      await intruder
        .patch(`/api/expenses/${own.id}`)
        .send({ category: { source: 'HOUSEHOLD', id: category.id } })
        .expect(400);
    });

    it('rejects names longer than 40 characters', async () => {
      const agent = await registerAndLogin('categories-e2e-long@example.com');

      await createExpense(agent, { source: 'NEW', name: 'x'.repeat(41) }, 400);
      await createExpense(agent, { source: 'NEW', name: '   ' }, 400);
    });

    it('ranks suggestions the Household uses more above others that match equally well', async () => {
      const agent = await registerAndLogin('categories-e2e-usage@example.com');
      const [, canina] = await search(agent, 'peluqueria');
      expect(canina.name).toBe('Peluquería canina');

      await createExpense(agent, { source: 'SYSTEM', id: canina.id });

      expect((await search(agent, 'peluqueria')).map((c) => c.name)).toEqual([
        'Peluquería canina',
        'Peluquería',
      ]);
    });
  });

  describe('System Category catalog sync', () => {
    const ADDED_NAME = 'Cerámica e2e';

    afterEach(async () => {
      // Expenses reference the added System Category, so they go first.
      await deleteTestUsers(prisma, 'categories-e2e');
      await prisma.systemExpenseCategory.deleteMany({
        where: { normalizedKey: 'ceramica e2e' },
      });
    });

    it('merges a Household Category into a newly added System Category with the same name', async () => {
      const agent = await registerAndLogin('categories-e2e-merge@example.com');
      const created = await agent
        .post('/api/expenses')
        .send({
          amount: 100,
          currency: 'ARS',
          category: { source: 'NEW', name: 'ceramica E2E' },
          occurredAt: '2026-01-10',
        })
        .expect(201);
      expect(created.body.category.source).toBe('HOUSEHOLD');

      await syncSystemCategories(prisma, {
        ...SYSTEM_CATEGORY_CATALOG,
        Pruebas: [ADDED_NAME],
      });

      const [expense] = (await agent.get('/api/expenses').expect(200)).body;
      expect(expense.category).toEqual({
        id: expect.any(String),
        name: ADDED_NAME,
        source: 'SYSTEM',
      });
      expect(await search(agent, 'ceramica e2e')).toEqual([expense.category]);
    });

    it('is idempotent', async () => {
      const before = await prisma.systemExpenseCategory.count();
      await syncSystemCategories(prisma);
      expect(await prisma.systemExpenseCategory.count()).toBe(before);
      expect(before).toBeGreaterThan(150);
    });
  });
});
