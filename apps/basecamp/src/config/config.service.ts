import { Injectable } from "@nestjs/common";
import { ConfigService as NestConfigService } from "@nestjs/config";
import { Env } from "./config.schema";

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: NestConfigService<Env, true>) {}

  public get<T extends keyof Env>(key: T): Env[T] {
    return this.configService.get(key, { infer: true });
  }
}
