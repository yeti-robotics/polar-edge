import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })
  );
  app.enableCors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  });
  await app.listen(process.env.PORT ?? 8080);
}
void bootstrap();
