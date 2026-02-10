import * as SecureStore from 'expo-secure-store';
import { Keypair } from '@solana/web3.js';
import { Buffer } from 'buffer';

const SESSION_KEY_NAME = 'monopay_session_key';

export const SessionManager = {
  /**
   * Generates a new local session key and stores it securely.
   */
  async createSession(): Promise<Keypair> {
    const keypair = Keypair.generate();
    const secretKeyBase64 = Buffer.from(keypair.secretKey).toString('base64');
    await SecureStore.setItemAsync(SESSION_KEY_NAME, secretKeyBase64);
    return keypair;
  },

  /**
   * Retrieves the existing session key.
   */
  async getSession(): Promise<Keypair | null> {
    const secretKeyBase64 = await SecureStore.getItemAsync(SESSION_KEY_NAME);
    if (!secretKeyBase64) return null;
    
    const secretKey = Buffer.from(secretKeyBase64, 'base64');
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
  },

  /**
   * Destroys the local session.
   */
  async revokeSession() {
    await SecureStore.deleteItemAsync(SESSION_KEY_NAME);
  }
};
