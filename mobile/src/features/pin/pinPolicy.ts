export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 6;

export function validatePin(pin: string): string | null {
  if (pin.length < PIN_MIN_LENGTH || pin.length > PIN_MAX_LENGTH) {
    return "PIN must be 4 to 6 digits";
  }
  if (!/^\d+$/.test(pin)) {
    return "PIN must contain only digits";
  }
  return null;
}
