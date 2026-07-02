import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/v1");
  app.use(cookieParser());
  const origins = (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(",");
  app.enableCors({ origin: origins, credentials: true });
  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
