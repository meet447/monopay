import type {
  ExecuteIntentRequest,
  ExecuteIntentResponse,
  HandleResponse,
  PaymentIntentCreateRequest,
  PaymentIntentCreateResponse,
  PaymentIntentStatusResponse,
  PinVerifyResponse,
  QuoteResponse,
  SessionResponse,
  UpsertHandleRequest,
} from "../types/api";

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
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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

  async verifyPin(pin: string): Promise<PinVerifyResponse> {
    return this.request<PinVerifyResponse>("/v1/pin/verify", {
      method: "POST",
      body: JSON.stringify({ pin }),
    });
  }

  async getCurrentSession(): Promise<SessionResponse> {
    return this.request<SessionResponse>("/v1/sessions/current");
  }

  async getUsdcQuote(inr: number): Promise<QuoteResponse> {
    return this.request<QuoteResponse>(`/v1/quotes/usdc?inr=${inr}`);
  }

  async createPaymentIntent(payload: PaymentIntentCreateRequest): Promise<PaymentIntentCreateResponse> {
    return this.request<PaymentIntentCreateResponse>("/v1/payment-intents", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async executePaymentIntent(id: string, payload: ExecuteIntentRequest): Promise<ExecuteIntentResponse> {
    return this.request<ExecuteIntentResponse>(`/v1/payment-intents/${id}/execute`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getPaymentIntent(id: string): Promise<PaymentIntentStatusResponse> {
    return this.request<PaymentIntentStatusResponse>(`/v1/payment-intents/${id}`);
  }

  async registerHandle(payload: UpsertHandleRequest): Promise<HandleResponse> {
    return this.request<HandleResponse>("/v1/handles", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async resolveHandle(handle: string): Promise<HandleResponse> {
    return this.request<HandleResponse>(`/v1/handles/${handle}`);
  }
}
