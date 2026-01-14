import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Mutex } from "async-mutex";
import { google, type sheets_v4 } from "googleapis";

export type SheetCredentials = {
  client_email: string;
  private_key: string;
};

@Injectable()
export class SheetService {
  private sheetsClient: sheets_v4.Sheets;
  private readonly logger = new Logger(SheetService.name);
  private readonly appendMutexes = new Map<string, Mutex>();

  private getAppendMutex(spreadsheetId: string): Mutex {
    let mutex = this.appendMutexes.get(spreadsheetId);
    if (!mutex) {
      mutex = new Mutex();
      this.appendMutexes.set(spreadsheetId, mutex);
    }
    return mutex;
  }

  constructor(private readonly configService: ConfigService) {
    if (!this.configService.get<string>("GOOGLE_APPLICATION_CREDENTIALS")) {
      throw new Error("GOOGLE_APPLICATION_CREDENTIALS is not set");
    }

    const credentials = JSON.parse(
      Buffer.from(
        // biome-ignore lint/style/noNonNullAssertion: temp
        this.configService.get<string>("GOOGLE_APPLICATION_CREDENTIALS")!,
        "base64"
      ).toString("utf-8")
    ) as SheetCredentials;

    const scopes = ["https://www.googleapis.com/auth/spreadsheets"];

    const auth = new google.auth.GoogleAuth({ credentials, scopes });
    this.sheetsClient = google.sheets({ version: "v4", auth });
  }

  async getSheetValues(
    spreadsheetId: string,
    range: string
  ): Promise<unknown[][] | undefined | null> {
    try {
      const res = await this.sheetsClient.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      return res.data.values;
    } catch (error) {
      this.logger.error(`Failed to get values from sheet: ${error}`);
      return [];
    }
  }

  async appendSheetValues(
    spreadsheetId: string,
    range: string,
    values: string[][],
    options: {
      valueInputOption?: "USER_ENTERED" | "RAW";
    } = {}
  ) {
    return this.getAppendMutex(spreadsheetId).runExclusive(async () => {
      try {
        const result = await this.sheetsClient.spreadsheets.values.append({
          spreadsheetId: spreadsheetId,
          range,
          valueInputOption: options.valueInputOption || "RAW",
          requestBody: { values },
        });

        if (!result.status.toString().startsWith("2")) {
          this.logger.error(`Failed to append values to sheet: ${result.status}`);
          throw new Error("Failed to append values to sheet");
        }

        return result.data;
      } catch (error) {
        this.logger.error(`Failed to append values to sheet: ${error}`);
        throw new Error("Failed to append values to sheet");
      }
    });
  }
}
