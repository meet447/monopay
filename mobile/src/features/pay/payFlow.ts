export type PayFlowState =
  | { kind: "idle" }
  | { kind: "pin_required" }
  | { kind: "creating_intent" }
  | { kind: "executing" }
  | { kind: "submitted"; signature: string; explorerUrl: string }
  | { kind: "failed"; message: string };

export const payFlowInitialState: PayFlowState = { kind: "idle" };

export function requiresFallback(errorMessage: string): boolean {
  const normalized = errorMessage.toLowerCase();
  return (
    normalized.includes("session expired") ||
    normalized.includes("session mismatch") ||
    normalized.includes("active session required")
  );
}
