import type { HandleResponse, UpsertHandleRequest } from "../types/api";

type ApiClientOptions = {
  baseUrl: string;
  userId?: string;
};

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.options.userId) {
      headers["x-user-id"] = this.options.userId;
    }

    console.log(`[API Request] ${init?.method || 'GET'} ${this.options.baseUrl}${path}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${this.options.baseUrl}${path}`, {
        ...init,
        headers: {
          ...headers,
          ...(init?.headers ?? {}),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let message = "";
        try {
          const errJson = await response.json();
          message = errJson?.error?.message || response.statusText;
        } catch (e) {
          message = await response.text() || response.statusText;
        }
        console.error(`[API Error] ${response.status}: ${message}`);
        throw new Error(message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`[API Success] ${path}`);
      return data as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error(`[API Timeout] ${path}`);
        throw new Error("Connection timeout. Please check if the server is running and accessible.");
      }
      console.error(`[API Network Error] ${path}:`, error.message);
      throw error;
    }
  }

  async resolveHandle(handle: string): Promise<HandleResponse> {
    return this.request<HandleResponse>(`/v1/handles/${handle}`);
  }

  async registerHandle(payload: UpsertHandleRequest): Promise<HandleResponse> {
    return this.request<HandleResponse>("/v1/handles", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}
