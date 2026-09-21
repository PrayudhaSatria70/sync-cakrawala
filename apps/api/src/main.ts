import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { AppModule } from './app.module';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const rawWebOrigin = config.get<string>('WEB_ORIGIN', 'http://localhost:3000');
  const sessionSecret = config.get<string>('SESSION_SECRET', 'dev-secret');
  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  const isProd = nodeEnv === 'production' || !!process.env.RAILWAY_ENVIRONMENT;

  // Enable trust proxy for reverse proxies (Railway, Vercel, Cloudflare, etc.)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // Parse allowed origins: support comma-separated list and strip trailing slashes
  const configuredOrigins = rawWebOrigin
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const allowedOrigins = new Set([
    ...configuredOrigins,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ]);

  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        rawWebOrigin === '*' ||
        allowedOrigins.has(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.vercel.sh') ||
        origin.endsWith('.railway.app') ||
        origin.endsWith('.cakrawala.ac.id')
      ) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Rejected origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Request-ID'],
    optionsSuccessStatus: 200,
  });

  const cookieSameSite = (config.get<string>('COOKIE_SAME_SITE') || (isProd ? 'none' : 'lax')) as
    | 'lax'
    | 'none'
    | 'strict';
  const cookieSecure = config.get<string>('COOKIE_SECURE')
    ? config.get<string>('COOKIE_SECURE') === 'true'
    : (isProd || cookieSameSite === 'none');

  app.use(cookieParser());
  app.use(
    session({
      name: 'sync.sid',
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      proxy: true,
      cookie: {
        httpOnly: true,
        sameSite: cookieSameSite,
        secure: cookieSecure,
        maxAge: 1000 * 60 * 60 * 8,
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new RequestIdInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = config.get<number>('PORT', 4000);
  await app.listen(port, '0.0.0.0');
  console.log(`SYNC API listening on http://localhost:${port}`);
}

bootstrap();
