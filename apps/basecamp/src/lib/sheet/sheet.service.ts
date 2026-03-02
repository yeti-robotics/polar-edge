import { sheets, type sheets_v4 } from "@googleapis/sheets";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { Mutex } from "async-mutex";
import type { Cache } from "cache-manager";
import { GoogleAuth } from "google-auth-library";
import { okAsync, ResultAsync } from "neverthrow";

export type SheetCredentials = {
  client_email: string;
  private_key: string;
};

@Injectable()
export class SheetService {
  private readonly sheetsClient: sheets_v4.Sheets;
  private readonly logger = new Logger(SheetService.name);
  private readonly appendMutex = new Mutex();

  constructor(
    credentials: SheetCredentials,
    private readonly spreadsheetId: string,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly cacheTtlMs: number
  ) {
    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    this.sheetsClient = sheets({ version: "v4", auth });
  }

  private cacheKey(range: string): string {
    return `sheet:${this.spreadsheetId}:${range}`;
  }

  get(range: string): ResultAsync<unknown[][], Error> {
    const key = this.cacheKey(range);

    return ResultAsync.fromPromise(
      this.cache.get<unknown[][]>(key),
      (cause) => new Error("Cache read failed", { cause })
    ).andThen((cached) => {
      if (cached != null) return okAsync(cached);

      return ResultAsync.fromPromise(
        this.sheetsClient.spreadsheets.values
          .get({ spreadsheetId: this.spreadsheetId, range })
          .then((res) => res.data.values ?? []),
        (cause) => {
          this.logger.error(`Failed to get sheet values: ${cause}`);
          return new Error("Failed to get sheet values", { cause });
        }
      ).andThen((data) =>
        ResultAsync.fromPromise(
          this.cache.set(key, data, this.cacheTtlMs),
          (cause) => new Error("Cache set failed", { cause })
        ).map(() => data)
      );
    });
  }

  append(
    range: string,
    values: string[][],
    options: { valueInputOption?: "USER_ENTERED" | "RAW" } = {}
  ): ResultAsync<void, Error> {
    const key = this.cacheKey(range);

    return ResultAsync.fromPromise(
      this.appendMutex.runExclusive(() =>
        this.sheetsClient.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range,
          valueInputOption: options.valueInputOption ?? "USER_ENTERED",
          requestBody: { values },
        })
      ),
      (cause) => {
        this.logger.error(`Failed to append sheet values: ${cause}`);
        return new Error("Failed to append sheet values", { cause });
      }
    )
      .andThen(() =>
        ResultAsync.fromPromise(
          this.cache.del(key),
          (cause) => new Error("Cache invalidation failed", { cause })
        )
      )
      .map(() => undefined);
  }
}
