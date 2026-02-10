import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Buffer } from 'buffer';
import bs58 from 'bs58';
import { WalletContextState } from '../types/state';
import { usePin } from './PinContext';
import { PriceService } from '../utils/prices';
import { ApiClient } from '../api/client';
import { API_BASE_URL } from '../config';

// Extending state to support multiple wallets
export type MultiWalletContextState = WalletContextState & {
  allWallets: Array<{address: string, label: string, handle?: string}>;
  importWallet: (privateKey: string, label: string, handle?: string) => Promise<void>;
  switchWallet: (address: string) => void;
  getActiveKeypair: () => Promise<Keypair | null>;
  refreshBalance: () => Promise<void>;
  balance: number | null;
  solPrice: number;
  transactions: any[];
  isLoadingTransactions: boolean;
};

const MultiWalletContext = createContext<MultiWalletContextState | undefined>(undefined);

const WALLETS_STORAGE_KEY = 'monopay_wallets_list';
const ACTIVE_WALLET_KEY = 'monopay_active_wallet';

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [allWallets, setAllWallets] = useState<Array<{address: string, label: string}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number>(15000);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const { resetPin } = usePin();

  const refreshBalance = useCallback(async () => {
    if (!publicKey) return;
    try {
      const connection = new Connection("https://api.devnet.solana.com", "confirmed");
      const [bal, price] = await Promise.all([
        connection.getBalance(publicKey),
        PriceService.getSolPriceInInr()
      ]);
      setBalance(bal / LAMPORTS_PER_SOL);
      setSolPrice(price);
      
      // Fetch Transactions more sparingly to avoid 429s
      setIsLoadingTransactions(true);
      const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 5 });
      
      const txDetails = [];
      for (const sig of signatures) {
        try {
          const tx = await connection.getParsedTransaction(sig.signature, { 
            maxSupportedTransactionVersion: 0 
          });
          txDetails.push({
            signature: sig.signature,
            time: sig.blockTime,
            status: sig.confirmationStatus,
            err: sig.err,
            details: tx
          });
          // Small delay to avoid hitting rate limits
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (e) {
          console.warn(`Failed to fetch details for ${sig.signature}`, e);
        }
      }
      setTransactions(txDetails);
    } catch (e) {
      console.error("Failed to fetch data", e);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [publicKey]);

  useEffect(() => {
    refreshBalance();
    const id = setInterval(refreshBalance, 30000); // Increased to 30s
    return () => clearInterval(id);
  }, [refreshBalance]);

  useEffect(() => {
    async function loadWallets() {
      try {
        const savedWallets = await SecureStore.getItemAsync(WALLETS_STORAGE_KEY);
        const activeAddr = await SecureStore.getItemAsync(ACTIVE_WALLET_KEY);
        
        if (savedWallets) {
          const parsed = JSON.parse(savedWallets);
          setAllWallets(parsed);
          
          if (activeAddr) {
            setPublicKey(new PublicKey(activeAddr));
          } else if (parsed.length > 0) {
            setPublicKey(new PublicKey(parsed[0].address));
          }
        }
      } catch (e) {
        console.error('Load wallets failed', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadWallets();
  }, []);

  const importWallet = useCallback(async (privateKey: string, label: string, handle?: string) => {
    try {
      let keypair: Keypair;
      const trimmed = privateKey.trim();
      
      // Handle secret array format [1,2,3...]
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const secretKey = new Uint8Array(JSON.parse(trimmed));
        keypair = Keypair.fromSecretKey(secretKey);
      } 
      // Handle comma separated list
      else if (trimmed.includes(',')) {
        const secretKey = new Uint8Array(trimmed.split(',').map(n => parseInt(n.trim())));
        keypair = Keypair.fromSecretKey(secretKey);
      } 
      // Handle Base58
      else {
        try {
          const secretKey = bs58.decode(trimmed);
          keypair = Keypair.fromSecretKey(secretKey);
        } catch (e) {
          throw new Error("Invalid Private Key format. Use Base58 or Secret Array.");
        }
      }

      const address = keypair.publicKey.toBase58();

      // Register handle if provided
      if (handle) {
        const client = new ApiClient({ baseUrl: API_BASE_URL });
        await client.registerHandle({ handle, wallet: address });
      }

      const secretBase64 = Buffer.from(keypair.secretKey).toString('base64');
      
      // Store the secret key encrypted by the OS keychain
      await SecureStore.setItemAsync(`secret_${address}`, secretBase64);
      
      const newList = [...allWallets, { address, label, handle }];
      await SecureStore.setItemAsync(WALLETS_STORAGE_KEY, JSON.stringify(newList));
      await SecureStore.setItemAsync(ACTIVE_WALLET_KEY, address);
      
      setAllWallets(newList);
      setPublicKey(keypair.publicKey);
    } catch (e: any) {
      throw new Error(`Import failed: ${e.message}`);
    }
  }, [allWallets]);

  const switchWallet = useCallback(async (address: string) => {
    await SecureStore.setItemAsync(ACTIVE_WALLET_KEY, address);
    setPublicKey(new PublicKey(address));
  }, []);

  const getActiveKeypair = useCallback(async () => {
    if (!publicKey) return null;
    const address = publicKey.toBase58();
    const secretBase64 = await SecureStore.getItemAsync(`secret_${address}`);
    if (!secretBase64) return null;
    
    const secretKey = Buffer.from(secretBase64, 'base64');
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
  }, [publicKey]);

  const connect = useCallback(async () => {
    // Triggers UI flow
  }, []);

  const disconnect = useCallback(async () => {
    await SecureStore.deleteItemAsync(WALLETS_STORAGE_KEY);
    await SecureStore.deleteItemAsync(ACTIVE_WALLET_KEY);
    await resetPin(); 
    setPublicKey(null);
    setAllWallets([]);
  }, [resetPin]);

  return (
    <MultiWalletContext.Provider value={{ 
      publicKey, 
      allWallets, 
      connect, 
      disconnect, 
      isLoading,
      importWallet,
      switchWallet,
      getActiveKeypair,
      refreshBalance,
      balance,
      solPrice,
      transactions,
      isLoadingTransactions
    }}>
      {children}
    </MultiWalletContext.Provider>
  );
}

export const useWallet = () => {
  const context = useContext(MultiWalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
};
