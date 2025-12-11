"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ConnectEmbed, useActiveAccount } from "thirdweb/react";
import { inAppWallet, type Wallet } from "thirdweb/wallets";
import { client } from "~/lib/thirdweb";

interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface WalletLoginProps {
  onConnected: (address: string, strategy: string) => void;
  onSkip?: () => void;
  farcasterUser?: FarcasterUser | null;
  isInMiniApp?: boolean;
}

// Configure wallets with supported auth strategies
const wallets = [
  inAppWallet({
    auth: {
      options: ["farcaster", "google", "email", "phone", "passkey"],
    },
  }),
];

export default function WalletLogin({
  onConnected,
  onSkip,
  farcasterUser,
  isInMiniApp,
}: WalletLoginProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  const activeAccount = useActiveAccount();

  // Memoized connect handler
  const handleFarcasterAutoLogin = useCallback(
    (fid: number, username?: string) => {
      // Use FID as a pseudo-address for Farcaster users
      const farcasterAddress = `farcaster:${fid}`;
      const strategy = `farcaster${username ? `:${username}` : ""}`;

      // Save to localStorage
      localStorage.setItem("walletAddress", farcasterAddress);
      localStorage.setItem("authStrategy", strategy);
      localStorage.setItem("farcasterFid", fid.toString());
      if (username) {
        localStorage.setItem("farcasterUsername", username);
      }

      setIsConnected(true);
      onConnected(farcasterAddress, strategy);
    },
    [onConnected]
  );

  // Auto-login for Farcaster MiniApp users
  useEffect(() => {
    if (
      isInMiniApp &&
      farcasterUser &&
      farcasterUser.fid &&
      !autoLoginAttempted &&
      !isConnected
    ) {
      setAutoLoginAttempted(true);
      handleFarcasterAutoLogin(farcasterUser.fid, farcasterUser.username);
    }
  }, [
    isInMiniApp,
    farcasterUser,
    autoLoginAttempted,
    isConnected,
    handleFarcasterAutoLogin,
  ]);

  // Check for existing connection in localStorage
  useEffect(() => {
    const savedAddress = localStorage.getItem("walletAddress");
    const savedStrategy = localStorage.getItem("authStrategy");
    if (savedAddress && savedStrategy && !isConnected) {
      setIsConnected(true);
      onConnected(savedAddress, savedStrategy);
    }
  }, [onConnected, isConnected]);

  // Handle when activeAccount changes (user connects via thirdweb)
  useEffect(() => {
    if (activeAccount && !isConnected) {
      const address = activeAccount.address;
      const strategy = "thirdweb";

      // Save to localStorage
      localStorage.setItem("walletAddress", address);
      localStorage.setItem("authStrategy", strategy);

      setIsConnected(true);
      onConnected(address, strategy);
    }
  }, [activeAccount, isConnected, onConnected]);

  const handleConnect = (wallet: Wallet) => {
    const account = wallet.getAccount();
    if (account) {
      const address = account.address;
      const strategy = "thirdweb";

      // Save to localStorage
      localStorage.setItem("walletAddress", address);
      localStorage.setItem("authStrategy", strategy);

      setIsConnected(true);
      onConnected(address, strategy);
    }
  };

  if (isConnected) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl">✓</span>
        </div>
        <p className="text-slate-700 font-medium">Connected!</p>
        <p className="text-slate-500 text-sm mt-1">Proceeding to pledge...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800">
          Connect Your Wallet
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Sign in to save your progress across devices
        </p>
      </div>

      {/* Thirdweb Connect Embed */}
      <div className="flex justify-center">
        <ConnectEmbed
          client={client}
          wallets={wallets}
          modalSize="compact"
          theme="light"
          onConnect={handleConnect}
          showThirdwebBranding={false}
        />
      </div>

      {/* Divider */}
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-slate-500">or</span>
        </div>
      </div>

      {/* Skip Option */}
      {onSkip && (
        <button
          onClick={onSkip}
          className="w-full text-slate-500 text-sm hover:text-slate-700 py-2"
        >
          Continue without signing in
        </button>
      )}

      {/* Privacy Note */}
      <p className="text-center text-xs text-slate-400 mt-6">
        By continuing, you agree to our Terms of Service and Privacy Policy.
        Your wallet is non-custodial and secure.
      </p>
    </div>
  );
}
