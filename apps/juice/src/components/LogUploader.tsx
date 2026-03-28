import { useCallback, useRef, useState } from "react";
import { LogStoreService } from "@/services/LogStore";
import type { StoredLog } from "@/services/LogStore";
import { importLogFile } from "@/services/import";
import { acceptedExtensions } from "@/services/registry";
import { LogAnalysis } from "./LogAnalysis";

export function LogUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [logs, setLogs] = useState<StoredLog[]>([]);
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<StoredLog | null>(null);

  const refreshLogs = useCallback(async () => {
    const store = await LogStoreService.getInstance();
    setLogs(await store.getAllLogs());
  }, []);

  const initialized = useRef(false);
  if (!initialized.current) {
    initialized.current = true;
    refreshLogs();
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    setImportProgress(0);

    // Close main thread's IDB connection to avoid contention
    const store = await LogStoreService.getInstance();
    store.close();

    try {
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        await importLogFile(file.name, buffer, setImportProgress);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to import log");
    } finally {
      setImportProgress(null);
      if (inputRef.current) inputRef.current.value = "";
      await store.reopen();
      await refreshLogs();
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const store = await LogStoreService.getInstance();
    await store.deleteLog(id);
    if (selectedLog?.id === id) setSelectedLog(null);
    await refreshLogs();
  };

  const handleClearAll = async () => {
    const store = await LogStoreService.getInstance();
    await store.clearAll();
    setSelectedLog(null);
    setLogs([]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  if (selectedLog) {
    return (
      <LogAnalysis log={selectedLog} onBack={() => setSelectedLog(null)} />
    );
  }

  const importing = importProgress !== null;

  return (
    <div className="flex flex-col gap-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !importing && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
          importing
            ? "border-primary/30 bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        }`}
      >
        {importing ? (
          <>
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-200"
                style={{ width: `${importProgress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Importing... {importProgress}%
            </p>
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
            <p className="text-sm text-muted-foreground">
              Drop log files here or click to browse
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={acceptedExtensions.join(",")}
          multiple
          className="hidden"
          disabled={importing}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {logs.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Imported Logs</h2>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Clear all
            </button>
          </div>
          <ul className="flex flex-col gap-1">
            {logs.map((log) => (
              <li
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted/50"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{log.fileName}</span>
                  <span className="text-xs text-muted-foreground">
                    {log.recordCount.toLocaleString()} records
                    {" · "}
                    {new Date(log.startTime).toLocaleString()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDelete(log.id, e)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
