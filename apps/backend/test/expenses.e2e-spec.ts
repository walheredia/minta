import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

describe('ExpensesController (e2e)', () => {
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
  });

  afterEach(async () => {
    await prisma.expense.deleteMany({ where: { user: { email: { contains: 'expenses-e2e' } } } });
    await prisma.refreshToken.deleteMany({ where: { user: { email: { contains: 'expenses-e2e' } } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'expenses-e2e' } } });
    await app.close();
  });

  async function registerAndLogin(email: string, password: string) {
    await request(app.getHttpServer()).post('/api/auth/register').send({ email, password }).expect(201);

    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/login').send({ email, password }).expect(200);
    return agent;
  }

  describe('POST /api/expenses', () => {
    it('creates an expense for the authenticated user, forcing visibility, householdId and userId', async () => {
      const agent = await registerAndLogin('expenses-e2e-create@example.com', 'correct-horse-battery');

      const response = await agent
        .post('/api/expenses')
        .send({
          amount: 1500.5,
          currency: 'ARS',
          description: 'Supermercado',
          occurredAt: '2026-01-10',
          visibility: 'SHARED',
          householdId: 'some-other-household',
          userId: 'someone-else',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        amount: '1500.5',
        currency: 'ARS',
        description: 'Supermercado',
        visibility: 'PERSONAL',
        householdId: null,
      });
      expect(new Date(response.body.occurredAt).toISOString().slice(0, 10)).toBe('2026-01-10');

      const user = await prisma.user.findUniqueOrThrow({
        where: { email: 'expenses-e2e-create@example.com' },
      });
      expect(response.body.userId).toBe(user.id);

      const created = await prisma.expense.findUniqueOrThrow({ where: { id: response.body.id } });
      expect(created.visibility).toBe('PERSONAL');
      expect(created.householdId).toBeNull();
      expect(created.userId).toBe(user.id);
    });

    it('returns 401 without a valid session', async () => {
      await request(app.getHttpServer())
        .post('/api/expenses')
        .send({ amount: 100, currency: 'ARS', description: 'Sin sesión', occurredAt: '2026-01-10' })
        .expect(401);
    });
  });

  describe('GET /api/expenses', () => {
    it('lists only the authenticated user own expenses, ordered descending by occurredAt', async () => {
      const agent = await registerAndLogin('expenses-e2e-list@example.com', 'correct-horse-battery');
      const otherAgent = await registerAndLogin('expenses-e2e-other@example.com', 'correct-horse-battery');

      await agent
        .post('/api/expenses')
        .send({ amount: 100, currency: 'ARS', description: 'Primero', occurredAt: '2026-01-05' })
        .expect(201);
      await agent
        .post('/api/expenses')
        .send({ amount: 200, currency: 'ARS', description: 'Más reciente', occurredAt: '2026-01-20' })
        .expect(201);
      await otherAgent
        .post('/api/expenses')
        .send({ amount: 999, currency: 'USD', description: 'De otro usuario', occurredAt: '2026-01-15' })
        .expect(201);

      const response = await agent.get('/api/expenses').expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.map((expense: { description: string }) => expense.description)).toEqual([
        'Más reciente',
        'Primero',
      ]);
    });

    it('returns 401 without a valid session', async () => {
      await request(app.getHttpServer()).get('/api/expenses').expect(401);
    });

    it('does not let a second user see the first user expenses', async () => {
      const agent = await registerAndLogin('expenses-e2e-isolation-a@example.com', 'correct-horse-battery');
      const otherAgent = await registerAndLogin(
        'expenses-e2e-isolation-b@example.com',
        'correct-horse-battery',
      );

      await agent
        .post('/api/expenses')
        .send({ amount: 500, currency: 'USD', description: 'Privado de A', occurredAt: '2026-01-10' })
        .expect(201);

      const response = await otherAgent.get('/api/expenses').expect(200);

      expect(response.body).toEqual([]);
    });
  });
});
