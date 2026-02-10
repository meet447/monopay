export type PinVerifyResponse = {
  verified: boolean;
  pinToken: string;
  expiresAt: string;
};

export type SessionResponse = {
  id: string;
  status: "active" | "expired" | "revoked";
  wallet: string;
  perTxLimitInr: number;
  dailyLimitInr: number;
  remainingTodayInr: number;
  expiresAt: string;
};

export type QuoteResponse = {
  inr: string;
  usdc: string;
  rate: string;
  source: string;
  asOf: string;
  expiresAt: string;
};

export type PaymentIntentCreateRequest = {
  recipientHandle: string;
  inrAmount: number;
  token: "USDC" | "SOL";
  memo?: string;
};

export type PaymentIntentCreateResponse = {
  id: string;
  wallet: string;
  recipientWallet: string;
  inrAmount: string;
  tokenAmount: string;
  token: string;
  quoteExpiresAt: string;
  reference: string;
};

export type ExecuteIntentRequest = {
  pinToken: string;
  sessionId: string;
};

export type ExecuteIntentResponse = {
  id: string;
  status: string;
  mode: "session_fast_path" | "wallet_fallback_path" | string;
  signature: string;
  explorerUrl: string;
};

export type PaymentIntentStatusResponse = {
  id: string;
  status: string;
  mode: string;
  signature?: string;
  explorerUrl?: string;
};
