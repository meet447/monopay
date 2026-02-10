import { useState, useEffect } from "react";
import { PriceService } from "../utils/prices";

export function useQuote(inrAmount: string) {
  const [quote, setQuote] = useState<{sol: string, rate: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const amount = parseFloat(inrAmount);
    if (isNaN(amount) || amount <= 0) {
      setQuote(null);
      return;
    }

    const calculate = async () => {
      setIsLoading(true);
      try {
        const priceInInr = await PriceService.getSolPriceInInr();
        const solAmount = (amount / priceInInr).toFixed(6);
        
        setQuote({
          sol: solAmount,
          rate: priceInInr.toLocaleString(undefined, { maximumFractionDigits: 2 })
        });
      } catch (e) {
        console.error("Quote calculation failed", e);
      } finally {
        setIsLoading(false);
      }
    };

    calculate();
  }, [inrAmount]);

  return { quote, isLoading };
}
