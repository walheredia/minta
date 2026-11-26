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

  async function registerUser(email: string, password: string) {
    await request(app.getHttpServer()).post('/api/auth/register').send({ email, password }).expect(201);
  }

  afterEach(async () => {
    await prisma.refreshToken.deleteMany({ where: { user: { email: { contains: 'auth-e2e' } } } });
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

  describe('POST /api/auth/login', () => {
    it('logs in with correct credentials and sets the session cookies', async () => {
      await registerUser('auth-e2e-login@example.com', 'correct-horse-battery');

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'auth-e2e-login@example.com', password: 'correct-horse-battery' })
        .expect(200);

      expect(response.body).toMatchObject({ email: 'auth-e2e-login@example.com' });

      const cookies = response.headers['set-cookie'] as unknown as string[];
      const accessCookie = cookies.find((cookie) => cookie.startsWith('minta_access='));
      const refreshCookie = cookies.find((cookie) => cookie.startsWith('minta_refresh='));

      expect(accessCookie).toBeDefined();
      expect(accessCookie).toMatch(/HttpOnly/i);
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toMatch(/HttpOnly/i);

      const storedTokens = await prisma.refreshToken.findMany({
        where: { user: { email: 'auth-e2e-login@example.com' } },
      });
      expect(storedTokens).toHaveLength(1);
      expect(storedTokens[0].tokenHash).not.toContain(refreshCookie);
    });

    it('rejects a wrong password without setting any session cookie', async () => {
      await registerUser('auth-e2e-wrong-password@example.com', 'correct-horse-battery');

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'auth-e2e-wrong-password@example.com', password: 'not-the-right-password' })
        .expect(401);

      expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('returns the exact same generic error for a wrong password and for an unregistered email', async () => {
      await registerUser('auth-e2e-wrong-password@example.com', 'correct-horse-battery');

      const wrongPassword = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'auth-e2e-wrong-password@example.com', password: 'not-the-right-password' })
        .expect(401);

      const unknownEmail = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'auth-e2e-unknown@example.com', password: 'whatever-password' })
        .expect(401);

      expect(wrongPassword.body.message).toEqual(unknownEmail.body.message);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 401 when there is no session', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('returns the authenticated user when the access token cookie is valid', async () => {
      await registerUser('auth-e2e-me@example.com', 'correct-horse-battery');
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/api/auth/login')
        .send({ email: 'auth-e2e-me@example.com', password: 'correct-horse-battery' })
        .expect(200);

      const response = await agent.get('/api/auth/me').expect(200);
      expect(response.body).toMatchObject({ email: 'auth-e2e-me@example.com' });
      expect(response.body.passwordHash).toBeUndefined();
    });
  });
});
