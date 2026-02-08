/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';
import * as fs from 'fs';

async function bootstrap() {
  // Check if SSL certificates exist (optional HTTPS support)
  const keyPath = join(__dirname, '..', 'ssl', 'key.pem');
  const certPath = join(__dirname, '..', 'ssl', 'cert.pem');
  let httpsOptions: any = undefined;
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    console.log('✓ HTTPS enabled with SSL certificates');
  } else {
    console.log('⚠ Running in HTTP mode (SSL certificates not found)');
  }

  // Pass httpsOptions to NestFactory (undefined = HTTP, object = HTTPS)
  const app = await NestFactory.create(
    AppModule,
    httpsOptions ? { httpsOptions } : {},
  );

  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'https://localhost:5174', // HTTPS localhost
      'http://192.168.31.246:5174',
      'https://192.168.31.246:5174', // HTTPS from phone
      'https://192.168.31.246:5175',
      'https://192.168.31.246:5176',
    ],
    methods: 'GET,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Listen on all network interfaces (0.0.0.0) to accept connections from phone
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
