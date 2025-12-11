"use client";

import { useState, useCallback, useEffect } from "react";
import { inAppWallet } from "thirdweb/wallets";
import type { Account, Wallet } from "thirdweb/wallets";
import { client } from "~/lib/thirdweb";

export type AuthStrategy = "farcaster" | "google" | "email";

export interface ThirdwebAuthState {
  account: Account | null;
  wallet: Wallet | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  strategy: AuthStrategy | null;
}

export interface UseThirdwebAuthReturn extends ThirdwebAuthState {
  connectWithFarcaster: () => Promise<Account | null>;
  connectWithGoogle: () => Promise<Account | null>;
  connectWithEmail: (
    email: string
  ) => Promise<{ success: boolean; needsVerification?: boolean }>;
  verifyEmailCode: (email: string, code: string) => Promise<Account | null>;
  disconnect: () => Promise<void>;
  clearError: () => void;
}

const STORAGE_KEY = "thirdweb_auth_state";

export function useThirdwebAuth(): UseThirdwebAuthReturn {
  const [state, setState] = useState<ThirdwebAuthState>({
    account: null,
    wallet: null,
    isConnecting: false,
    isConnected: false,
    error: null,
    strategy: null,
  });

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const { strategy, address } = JSON.parse(saved);
          if (strategy && address) {
            // Session exists, but we need to reconnect
            // The wallet will auto-reconnect if the session is still valid
            console.log("Previous session found:", { strategy, address });
          }
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
      }
    };
    restoreSession();
  }, []);

  // Save session state
  const saveSession = useCallback(
    (account: Account | null, strategy: AuthStrategy | null) => {
      if (account && strategy) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            strategy,
            address: account.address,
            timestamp: Date.now(),
          })
        );
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
    []
  );

  // Connect with Farcaster OAuth
  const connectWithFarcaster =
    useCallback(async (): Promise<Account | null> => {
      try {
        setState((prev) => ({ ...prev, isConnecting: true, error: null }));

        const wallet = inAppWallet();
        const account = await wallet.connect({
          client,
          strategy: "farcaster",
        });

        setState({
          account,
          wallet,
          isConnecting: false,
          isConnected: true,
          error: null,
          strategy: "farcaster",
        });

        saveSession(account, "farcaster");
        console.log("Connected with Farcaster:", account.address);
        return account;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to connect with Farcaster";
        setState((prev) => ({
          ...prev,
          isConnecting: false,
          error: errorMessage,
        }));
        console.error("Farcaster connection error:", error);
        return null;
      }
    }, [saveSession]);

  // Connect with Google OAuth
  const connectWithGoogle = useCallback(async (): Promise<Account | null> => {
    try {
      setState((prev) => ({ ...prev, isConnecting: true, error: null }));

      const wallet = inAppWallet();
      const account = await wallet.connect({
        client,
        strategy: "google",
      });

      setState({
        account,
        wallet,
        isConnecting: false,
        isConnected: true,
        error: null,
        strategy: "google",
      });

      saveSession(account, "google");
      console.log("Connected with Google:", account.address);
      return account;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to connect with Google";
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }));
      console.error("Google connection error:", error);
      return null;
    }
  }, [saveSession]);

  // Initiate email login (sends verification code)
  const connectWithEmail = useCallback(
    async (
      email: string
    ): Promise<{ success: boolean; needsVerification?: boolean }> => {
      try {
        setState((prev) => ({ ...prev, isConnecting: true, error: null }));

        // For email strategy, we need to use the preAuth flow
        // This will send a verification code to the email
        const response = await fetch(
          "https://api.thirdweb.com/v1/auth/initiate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-client-id": process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
            },
            body: JSON.stringify({
              type: "email",
              email,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to send verification code");
        }

        setState((prev) => ({
          ...prev,
          isConnecting: false,
          strategy: "email",
        }));

        return { success: true, needsVerification: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to send verification code";
        setState((prev) => ({
          ...prev,
          isConnecting: false,
          error: errorMessage,
        }));
        console.error("Email initiation error:", error);
        return { success: false };
      }
    },
    []
  );

  // Verify email code and complete connection
  const verifyEmailCode = useCallback(
    async (email: string, code: string): Promise<Account | null> => {
      try {
        setState((prev) => ({ ...prev, isConnecting: true, error: null }));

        const wallet = inAppWallet();
        const account = await wallet.connect({
          client,
          strategy: "email",
          email,
          verificationCode: code,
        });

        setState({
          account,
          wallet,
          isConnecting: false,
          isConnected: true,
          error: null,
          strategy: "email",
        });

        saveSession(account, "email");
        console.log("Connected with Email:", account.address);
        return account;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Invalid verification code";
        setState((prev) => ({
          ...prev,
          isConnecting: false,
          error: errorMessage,
        }));
        console.error("Email verification error:", error);
        return null;
      }
    },
    [saveSession]
  );

  // Disconnect wallet
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      if (state.wallet) {
        await state.wallet.disconnect();
      }

      setState({
        account: null,
        wallet: null,
        isConnecting: false,
        isConnected: false,
        error: null,
        strategy: null,
      });

      localStorage.removeItem(STORAGE_KEY);
      console.log("Disconnected");
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  }, [state.wallet]);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    connectWithFarcaster,
    connectWithGoogle,
    connectWithEmail,
    verifyEmailCode,
    disconnect,
    clearError,
  };
}
