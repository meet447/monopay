import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { PinState } from '../types/state';
import { validatePin } from '../features/pin/pinPolicy';

const PinContext = createContext<PinState | undefined>(undefined);

const PIN_HASH_KEY = 'solupi_pin_hash';

export function PinProvider({ children }: { children: ReactNode }) {
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkEnrollment() {
      const hash = await SecureStore.getItemAsync(PIN_HASH_KEY);
      setIsEnrolled(!!hash);
      setIsLoading(false);
    }
    checkEnrollment();
  }, []);

  const enroll = useCallback(async (pin: string) => {
    const error = validatePin(pin);
    if (error) throw new Error(error);

    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      pin
    );
    
    await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
    setIsEnrolled(true);
  }, []);

  const verify = useCallback(async (pin: string): Promise<boolean> => {
    const hash = await SecureStore.getItemAsync(PIN_HASH_KEY);
    if (!hash) return false;

    const inputHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      pin
    );
    
    return inputHash === hash;
  }, []);

  const resetPin = useCallback(async () => {
    await SecureStore.deleteItemAsync(PIN_HASH_KEY);
    setIsEnrolled(false);
  }, []);

  return (
    <PinContext.Provider value={{ isEnrolled, enroll, verify, resetPin }}>
      {!isLoading && children}
    </PinContext.Provider>
  );
}

export const usePin = () => {
  const context = useContext(PinContext);
  if (!context) throw new Error('usePin must be used within PinProvider');
  return context;
};
