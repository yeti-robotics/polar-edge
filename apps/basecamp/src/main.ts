import { type LogLevel, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { LoggingInterceptor } from "./lib/interceptors/logging.interceptor";

const LOG_LEVELS: LogLevel[] = ["fatal", "error", "warn", "log", "verbose", "debug"];

function getLogLevels(level: string): LogLevel[] {
  const idx = LOG_LEVELS.indexOf(level as LogLevel);
  return idx === -1 ? ["fatal", "error", "warn", "log"] : LOG_LEVELS.slice(0, idx + 1);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: getLogLevels(process.env.LOG_LEVEL ?? "log"),
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 8080);
}
void bootstrap();
