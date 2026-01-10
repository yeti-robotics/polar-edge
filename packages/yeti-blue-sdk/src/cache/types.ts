import type { CachedResponse } from "../fetcher/types";

export interface Cache<Value> {
  get(key: string): Promise<CachedResponse<Value> | null>;
  set(key: string, response: CachedResponse<Value>): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}
