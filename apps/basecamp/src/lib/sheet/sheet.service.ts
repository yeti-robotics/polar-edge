import { sheets, type sheets_v4 } from "@googleapis/sheets";
import { Injectable, Logger } from "@nestjs/common";
import { Mutex } from "async-mutex";
import { GoogleAuth } from "google-auth-library";
import { ResultAsync } from "neverthrow";

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
    private readonly spreadsheetId: string
  ) {
    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    this.sheetsClient = sheets({ version: "v4", auth });
  }

  get(range: string): ResultAsync<unknown[][], Error> {
    return ResultAsync.fromPromise(
      this.sheetsClient.spreadsheets.values
        .get({ spreadsheetId: this.spreadsheetId, range })
        .then((res) => res.data.values ?? []),
      (cause) => {
        this.logger.error(`Failed to get sheet values: ${cause}`);
        return new Error("Failed to get sheet values", { cause });
      }
    );
  }

  append(
    range: string,
    values: string[][],
    options: { valueInputOption?: "USER_ENTERED" | "RAW" } = {}
  ): ResultAsync<void, Error> {
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
    ).map(() => undefined);
  }
}
