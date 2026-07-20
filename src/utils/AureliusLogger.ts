export interface LogEntry {
  id: string;
  timestamp: string;
  type: "success" | "error" | "warn" | "info";
  url: string;
  method: string;
  status?: number;
  payload?: any;
  headers?: Record<string, string>;
  responseBody?: any;
  error?: string;
  stack?: string;
}

type LogListener = (logs: LogEntry[]) => void;

class AureliusLoggerService {
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogs = 100;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem("aurelius_debug_logs");
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("[AureliusLogger] Failed to restore logs from localStorage:", e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem("aurelius_debug_logs", JSON.stringify(this.logs));
    } catch (e) {
      console.warn("[AureliusLogger] Failed to save logs to localStorage:", e);
    }
  }

  private notify() {
    const currentLogs = [...this.logs];
    this.listeners.forEach((listener) => {
      try {
        listener(currentLogs);
      } catch (e) {
        console.error("[AureliusLogger] Error in listener:", e);
      }
    });
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    // Initial call
    listener([...this.logs]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public log(entry: Omit<LogEntry, "id" | "timestamp">) {
    const newEntry: LogEntry = {
      ...entry,
      id: "log_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now(),
      timestamp: new Date().toISOString()
    };

    // Console mirror
    if (entry.type === "error") {
      console.error(`[Aurelius System Trace Error] ${entry.method} ${entry.url}`, entry);
    } else if (entry.type === "warn") {
      console.warn(`[Aurelius System Trace Warn] ${entry.method} ${entry.url}`, entry);
    } else {
      console.log(`[Aurelius System Trace Info] ${entry.method} ${entry.url}`, entry);
    }

    this.logs.unshift(newEntry); // newest first

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    this.saveToStorage();
    this.notify();
  }

  public logRequestError(details: {
    url: string;
    method: string;
    payload?: any;
    status?: number;
    headers?: Record<string, string>;
    error: string;
    stack?: string;
    responseBody?: any;
  }) {
    this.log({
      type: "error",
      url: details.url,
      method: details.method,
      status: details.status,
      payload: details.payload,
      headers: details.headers,
      responseBody: details.responseBody,
      error: details.error,
      stack: details.stack
    });
  }

  public logRequestSuccess(details: {
    url: string;
    method: string;
    payload?: any;
    status: number;
    headers?: Record<string, string>;
    responseBody: any;
  }) {
    this.log({
      type: "success",
      url: details.url,
      method: details.method,
      status: details.status,
      payload: details.payload,
      headers: details.headers,
      responseBody: details.responseBody
    });
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    this.saveToStorage();
    this.notify();
  }
}

export const AureliusLogger = new AureliusLoggerService();
