import { Connection, PublicKey } from "@solana/web3.js";

// Using Birdeye or Jupiter v1 style (no API key needed for basic usage usually)
// Or fallback to a very stable simple API for the demo
const PRICE_API = "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT";
const DEFAULT_INR_RATE = 83.5; 

export const PriceService = {
  async getSolPriceInInr(): Promise<number> {
    try {
      const response = await fetch(PRICE_API);
      const data = await response.json();
      
      if (!data.price) {
        throw new Error("Price not found in response");
      }

      const solPriceInUsdc = parseFloat(data.price);
      return solPriceInUsdc * DEFAULT_INR_RATE;
    } catch (e) {
      console.warn("Failed to fetch real-time price, using fallback", e);
      return 15000; // Realistic rough price
    }
  },

  /**
   * Converts INR amount to SOL
   */
  async inrToSol(inrAmount: number): Promise<number> {
    const price = await this.getSolPriceInInr();
    return inrAmount / price;
  },

  /**
   * Converts SOL amount to INR
   */
  async solToInr(solAmount: number): Promise<number> {
    const price = await this.getSolPriceInInr();
    return solAmount * price;
  }
};
