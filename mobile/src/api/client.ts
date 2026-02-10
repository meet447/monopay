import type {
  ExecuteIntentRequest,
  ExecuteIntentResponse,
  PaymentIntentCreateRequest,
  PaymentIntentCreateResponse,
  PaymentIntentStatusResponse,
  PinVerifyResponse,
  QuoteResponse,
  SessionResponse,
} from "../types/api";

type ApiClientOptions = {
  baseUrl: string;
  userId: string;
};

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.options.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-user-id": this.options.userId,
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `HTTP ${response.status}`);
    }

    return (await response.json()) as T;
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
}
