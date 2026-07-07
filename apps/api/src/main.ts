import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { RedisIoAdapter } from "./messaging/redis-io.adapter";
import { UPLOADS_DIR } from "./common/uploads";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix("api/v1");
  app.use(cookieParser());
  const origins = (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(",");
  app.enableCors({ origin: origins, credentials: true });
  // Ficheros subidos (recursos de módulo): servidos como estáticos en /uploads.
  app.useStaticAssets(UPLOADS_DIR, { prefix: "/uploads/" });

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
