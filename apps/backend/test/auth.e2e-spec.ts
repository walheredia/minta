import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

describe('AuthController (e2e)', () => {
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
    await prisma.user.deleteMany({ where: { email: { contains: 'auth-e2e' } } });
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('creates a user with a hashed password and never returns the plaintext password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'auth-e2e-success@example.com', password: 'correct-horse-battery' })
        .expect(201);

      expect(response.body).toMatchObject({ email: 'auth-e2e-success@example.com' });
      expect(response.body.password).toBeUndefined();
      expect(response.body.passwordHash).toBeUndefined();

      const created = await prisma.user.findUniqueOrThrow({
        where: { email: 'auth-e2e-success@example.com' },
      });
      expect(created.passwordHash).not.toBe('correct-horse-battery');
      expect(created.passwordHash.startsWith('$argon2id$')).toBe(true);
    });

    it('rejects a duplicate email without creating a second user', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'auth-e2e-dup@example.com', password: 'correct-horse-battery' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'auth-e2e-dup@example.com', password: 'another-strong-password' })
        .expect(409);

      const count = await prisma.user.count({ where: { email: 'auth-e2e-dup@example.com' } });
      expect(count).toBe(1);
    });

    it('rejects a password that does not meet the minimum requirements without touching the database', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'auth-e2e-weak@example.com', password: 'short' })
        .expect(400);

      const count = await prisma.user.count({ where: { email: 'auth-e2e-weak@example.com' } });
      expect(count).toBe(0);
    });
  });
});
