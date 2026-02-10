import { PublicKey } from "@solana/web3.js";

export type WalletContextState = {
  publicKey: PublicKey | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isLoading: boolean;
};

export type PinState = {
  isEnrolled: boolean;
  enroll: (pin: string) => Promise<void>;
  verify: (pin: string) => Promise<boolean>;
  resetPin: () => Promise<void>;
};

export type SessionState = {
  hasActiveSession: boolean;
  limits: {
    perTxLimitInr: number;
    dailyLimitInr: number;
    remainingTodayInr: number;
  } | null;
  sessionPublicKey: PublicKey | null;
  createSession: () => Promise<void>;
};
