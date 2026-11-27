import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { syncSystemCategories } from './../src/expense-categories/system-categories.sync.js';
import { deleteTestUsers } from './cleanup.js';

describe('ExpensesController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let supermercado: { source: 'SYSTEM'; id: string };
  let combustible: { source: 'SYSTEM'; id: string };

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
    supermercado = {
      source: 'SYSTEM',
      id: await systemCategoryId('supermercado'),
    };
    combustible = {
      source: 'SYSTEM',
      id: await systemCategoryId('combustible'),
    };
  });

  async function systemCategoryId(normalizedKey: string) {
    const category = await prisma.systemExpenseCategory.findUniqueOrThrow({
      where: { normalizedKey },
    });
    return category.id;
  }

  afterEach(async () => {
    await deleteTestUsers(prisma, 'expenses-e2e');
    await app.close();
  });

  async function registerAndLogin(email: string, password: string) {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password })
      .expect(201);

    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/login').send({ email, password }).expect(200);
    return agent;
  }

  describe('POST /api/expenses', () => {
    it('creates an expense for the authenticated user, forcing visibility, householdId and userId', async () => {
      const agent = await registerAndLogin(
        'expenses-e2e-create@example.com',
        'correct-horse-battery',
      );

      const response = await agent
        .post('/api/expenses')
        .send({
          amount: 1500.5,
          currency: 'ARS',
          category: supermercado,
          detail: 'Supermercado',
          occurredAt: '2026-01-10',
          visibility: 'SHARED',
          householdId: 'some-other-household',
          userId: 'someone-else',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        amount: '1500.5',
        currency: 'ARS',
        category: { ...supermercado, name: 'Supermercado' },
        detail: 'Supermercado',
        visibility: 'PERSONAL',
        householdId: null,
      });
      expect(
        new Date(response.body.occurredAt).toISOString().slice(0, 10),
      ).toBe('2026-01-10');

      const user = await prisma.user.findUniqueOrThrow({
        where: { email: 'expenses-e2e-create@example.com' },
      });
      expect(response.body.userId).toBe(user.id);

      const created = await prisma.expense.findUniqueOrThrow({
        where: { id: response.body.id },
      });
      expect(created.visibility).toBe('PERSONAL');
      expect(created.householdId).toBeNull();
      expect(created.userId).toBe(user.id);
    });

    it('treats the Detail as optional, storing a blank one as null', async () => {
      const agent = await registerAndLogin(
        'expenses-e2e-no-detail@example.com',
        'correct-horse-battery',
      );

      const withoutDetail = await agent
        .post('/api/expenses')
        .send({
          amount: 10,
          currency: 'ARS',
          category: combustible,
          occurredAt: '2026-01-10',
        })
        .expect(201);
      const blankDetail = await agent
        .post('/api/expenses')
        .send({
          amount: 10,
          currency: 'ARS',
          category: combustible,
          detail: '   ',
          occurredAt: '2026-01-10',
        })
        .expect(201);

      expect(withoutDetail.body.detail).toBeNull();
      expect(blankDetail.body.detail).toBeNull();
      expect(withoutDetail.body.category).toEqual({
        ...combustible,
        name: 'Combustible',
      });
    });

    it('rejects an Expense without an Expense Category', async () => {
      const agent = await registerAndLogin(
        'expenses-e2e-no-category@example.com',
        'correct-horse-battery',
      );

      await agent
        .post('/api/expenses')
        .send({
          amount: 10,
          currency: 'ARS',
          detail: 'Sin tipo',
          occurredAt: '2026-01-10',
        })
        .expect(400);
    });

    it('rejects an unknown System Category with a generic message', async () => {
      const agent = await registerAndLogin(
        'expenses-e2e-bad-category@example.com',
        'correct-horse-battery',
      );

      const response = await agent
        .post('/api/expenses')
        .send({
          amount: 10,
          currency: 'ARS',
          category: { source: 'SYSTEM', id: 'does-not-exist' },
          occurredAt: '2026-01-10',
        })
        .expect(400);

      expect(response.body.message).toBe('Tipo de gasto inválido.');
      expect(await agent.get('/api/expenses').then((r) => r.body)).toEqual([]);
    });

    it('rejects a Detail longer than 200 characters', async () => {
      const agent = await registerAndLogin(
        'expenses-e2e-long-detail@example.com',
        'correct-horse-battery',
      );

      await agent
        .post('/api/expenses')
        .send({
          amount: 10,
          currency: 'ARS',
          category: combustible,
          detail: 'x'.repeat(201),
          occurredAt: '2026-01-10',
        })
        .expect(400);
    });

    it('returns 401 without a valid session', async () => {
      await request(app.getHttpServer())
        .post('/api/expenses')
        .send({
          amount: 100,
          currency: 'ARS',
          category: supermercado,
          detail: 'Sin sesión',
          occurredAt: '2026-01-10',
        })
        .expect(401);
    });
  });

  describe('GET /api/expenses', () => {
    it('lists only the authenticated user own expenses, ordered descending by occurredAt', async () => {
      const agent = await registerAndLogin(
        'expenses-e2e-list@example.com',
        'correct-horse-battery',
      );
      const otherAgent = await registerAndLogin(
        'expenses-e2e-other@example.com',
        'correct-horse-battery',
      );

      await agent
        .post('/api/expenses')
        .send({
          amount: 100,
          currency: 'ARS',
          category: supermercado,
          detail: 'Primero',
          occurredAt: '2026-01-05',
        })
        .expect(201);
      await agent
        .post('/api/expenses')
        .send({
          amount: 200,
          currency: 'ARS',
          category: supermercado,
          detail: 'Más reciente',
          occurredAt: '2026-01-20',
        })
        .expect(201);
      await otherAgent
        .post('/api/expenses')
        .send({
          amount: 999,
          currency: 'USD',
          category: supermercado,
          detail: 'De otro usuario',
          occurredAt: '2026-01-15',
        })
        .expect(201);

      const response = await agent.get('/api/expenses').expect(200);

      expect(response.body).toHaveLength(2);
      expect(
        response.body.map((expense: { detail: string }) => expense.detail),
      ).toEqual(['Más reciente', 'Primero']);
    });

    it('returns 401 without a valid session', async () => {
      await request(app.getHttpServer()).get('/api/expenses').expect(401);
    });

    it('does not let a second user see the first user expenses', async () => {
      const agent = await registerAndLogin(
        'expenses-e2e-isolation-a@example.com',
        'correct-horse-battery',
      );
      const otherAgent = await registerAndLogin(
        'expenses-e2e-isolation-b@example.com',
        'correct-horse-battery',
      );

      await agent
        .post('/api/expenses')
        .send({
          amount: 500,
          currency: 'USD',
          category: supermercado,
          detail: 'Privado de A',
          occurredAt: '2026-01-10',
        })
        .expect(201);

      const response = await otherAgent.get('/api/expenses').expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('PATCH /api/expenses/:id', () => {
    it("updates amount, currency, category, detail and occurredAt on the user's own expense", async () => {
      const agent = await registerAndLogin(
        'expenses-e2e-update@example.com',
        'correct-horse-battery',
      );

      const created = await agent
        .post('/api/expenses')
        .send({
          amount: 100,
          currency: 'ARS',
          category: supermercado,
          detail: 'Original',
          occurredAt: '2026-01-05',
        })
        .expect(201);

      const response = await agent
        .patch(`/api/expenses/${created.body.id}`)
        .send({
          amount: 250.75,
          currency: 'USD',
          category: combustible,
          detail: 'Corregido',
          occurredAt: '2026-02-01',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        id: created.body.id,
        amount: '250.75',
        currency: 'USD',
        category: { ...combustible, name: 'Combustible' },
        detail: 'Corregido',
      });
      expect(
        new Date(response.body.occurredAt).toISOString().slice(0, 10),
      ).toBe('2026-02-01');
    });

    it('clears the Detail when patched with null and keeps the category when omitted', async () => {
      const agent = await registerAndLogin(
        'expenses-e2e-clear-detail@example.com',
        'correct-horse-battery',
      );

      const created = await agent
        .post('/api/expenses')
        .send({
          amount: 100,
          currency: 'ARS',
          category: combustible,
          detail: 'YPF',
          occurredAt: '2026-01-05',
        })
        .expect(201);

      const response = await agent
        .patch(`/api/expenses/${created.body.id}`)
        .send({ detail: null })
        .expect(200);

      expect(response.body.detail).toBeNull();
      expect(response.body.category).toEqual({
        ...combustible,
        name: 'Combustible',
      });
    });

    it('rejects changing to an unknown System Category', async () => {
      const agent = await registerAndLogin(
        'expenses-e2e-patch-bad@example.com',
        'correct-horse-battery',
      );

      const created = await agent
        .post('/api/expenses')
        .send({
          amount: 100,
          currency: 'ARS',
          category: combustible,
          occurredAt: '2026-01-05',
        })
        .expect(201);

      await agent
        .patch(`/api/expenses/${created.body.id}`)
        .send({ category: { source: 'SYSTEM', id: 'does-not-exist' } })
        .expect(400);
    });

    it('returns 404 when trying to edit another user expense, not 403', async () => {
      const agent = await registerAndLogin(
        'expenses-e2e-update-owner@example.com',
        'correct-horse-battery',
      );
      const otherAgent = await registerAndLogin(
        'expenses-e2e-update-intruder@example.com',
        'correct-horse-battery',
      );

      const created = await agent
        .post('/api/expenses')
        .send({
          amount: 100,
          currency: 'ARS',
          category: supermercado,
          detail: 'Privado',
          occurredAt: '2026-01-05',
        })
        .expect(201);

      await otherAgent
        .patch(`/api/expenses/${created.body.id}`)
        .send({ category: supermercado, detail: 'Intento ajeno' })
        .expect(404);
    });

    it('returns 401 without a valid session', async () => {
      await request(app.getHttpServer())
        .patch('/api/expenses/some-id')
        .send({ category: supermercado, detail: 'Sin sesión' })
        .expect(401);
    });
  });

  describe('DELETE /api/expenses/:id', () => {
    it("deletes the user's own expense", async () => {
      const agent = await registerAndLogin(
        'expenses-e2e-delete@example.com',
        'correct-horse-battery',
      );

      const created = await agent
        .post('/api/expenses')
        .send({
          amount: 100,
          currency: 'ARS',
          category: supermercado,
          detail: 'A borrar',
          occurredAt: '2026-01-05',
        })
        .expect(201);

      await agent.delete(`/api/expenses/${created.body.id}`).expect(204);

      const remaining = await agent.get('/api/expenses').expect(200);
      expect(remaining.body).toEqual([]);
    });

    it('returns 404 when trying to delete another user expense, not 403', async () => {
      const agent = await registerAndLogin(
        'expenses-e2e-delete-owner@example.com',
        'correct-horse-battery',
      );
      const otherAgent = await registerAndLogin(
        'expenses-e2e-delete-intruder@example.com',
        'correct-horse-battery',
      );

      const created = await agent
        .post('/api/expenses')
        .send({
          amount: 100,
          currency: 'ARS',
          category: supermercado,
          detail: 'Privado',
          occurredAt: '2026-01-05',
        })
        .expect(201);

      await otherAgent.delete(`/api/expenses/${created.body.id}`).expect(404);

      const stillThere = await agent.get('/api/expenses').expect(200);
      expect(stillThere.body).toHaveLength(1);
    });

    it('returns 401 without a valid session', async () => {
      await request(app.getHttpServer())
        .delete('/api/expenses/some-id')
        .expect(401);
    });
  });
});
