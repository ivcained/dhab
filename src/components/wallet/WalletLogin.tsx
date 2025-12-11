"use client";

import React, { useState } from "react";
import { useThirdwebAuth } from "~/hooks/useThirdwebAuth";

interface WalletLoginProps {
  onConnected: (address: string, strategy: string) => void;
  onSkip?: () => void;
}

export default function WalletLogin({ onConnected, onSkip }: WalletLoginProps) {
  const {
    isConnecting,
    isConnected,
    account,
    error,
    strategy,
    connectWithFarcaster,
    connectWithGoogle,
    connectWithEmail,
    verifyEmailCode,
    clearError,
  } = useThirdwebAuth();

  const [emailInput, setEmailInput] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  // Handle successful connection
  React.useEffect(() => {
    if (isConnected && account && strategy) {
      onConnected(account.address, strategy);
    }
  }, [isConnected, account, strategy, onConnected]);

  const handleFarcasterLogin = async () => {
    clearError();
    await connectWithFarcaster();
  };

  const handleGoogleLogin = async () => {
    clearError();
    await connectWithGoogle();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    clearError();
    const result = await connectWithEmail(emailInput.trim());
    if (result.success && result.needsVerification) {
      setPendingEmail(emailInput.trim());
      setAwaitingVerification(true);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim() || !pendingEmail) return;

    clearError();
    await verifyEmailCode(pendingEmail, verificationCode.trim());
  };

  const resetEmailFlow = () => {
    setShowEmailInput(false);
    setAwaitingVerification(false);
    setEmailInput("");
    setVerificationCode("");
    setPendingEmail("");
    clearError();
  };

  if (isConnected && account) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl">✓</span>
        </div>
        <p className="text-slate-700 font-medium">Connected!</p>
        <p className="text-slate-500 text-sm mt-1 font-mono">
          {account.address.slice(0, 6)}...{account.address.slice(-4)}
        </p>
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

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={clearError}
            className="text-red-500 text-xs underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Email Verification Flow */}
      {awaitingVerification ? (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📧</span>
            </div>
            <p className="text-slate-700 font-medium">Check your email</p>
            <p className="text-slate-500 text-sm mt-1">
              We sent a code to {pendingEmail}
            </p>
          </div>

          <form onSubmit={handleVerifyCode} className="space-y-3">
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter verification code"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
              maxLength={6}
              autoFocus
            />
            <button
              type="submit"
              disabled={isConnecting || !verificationCode.trim()}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-xl font-medium transition-colors"
            >
              {isConnecting ? "Verifying..." : "Verify Code"}
            </button>
          </form>

          <button
            onClick={resetEmailFlow}
            className="w-full text-slate-500 text-sm hover:text-slate-700"
          >
            ← Use different method
          </button>
        </div>
      ) : showEmailInput ? (
        /* Email Input Flow */
        <div className="space-y-4">
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={isConnecting || !emailInput.trim()}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-xl font-medium transition-colors"
            >
              {isConnecting ? "Sending code..." : "Continue with Email"}
            </button>
          </form>

          <button
            onClick={resetEmailFlow}
            className="w-full text-slate-500 text-sm hover:text-slate-700"
          >
            ← Back to login options
          </button>
        </div>
      ) : (
        /* Main Login Options */
        <div className="space-y-3">
          {/* Farcaster Login */}
          <button
            onClick={handleFarcasterLogin}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl font-medium transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.24 0.24H5.76C2.58 0.24 0 2.82 0 6v12c0 3.18 2.58 5.76 5.76 5.76h12.48c3.18 0 5.76-2.58 5.76-5.76V6c0-3.18-2.58-5.76-5.76-5.76zM19.52 18c0 0.85-0.69 1.54-1.54 1.54H6.02c-0.85 0-1.54-0.69-1.54-1.54V6c0-0.85 0.69-1.54 1.54-1.54h11.96c0.85 0 1.54 0.69 1.54 1.54v12z" />
              <path d="M16.5 7.5h-9v2.25h3.375v6.75h2.25v-6.75H16.5z" />
            </svg>
            {isConnecting ? "Connecting..." : "Continue with Farcaster"}
          </button>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 disabled:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-medium transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isConnecting ? "Connecting..." : "Continue with Google"}
          </button>

          {/* Email Login */}
          <button
            onClick={() => setShowEmailInput(true)}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors"
          >
            <span className="text-xl">📧</span>
            Continue with Email
          </button>

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
        </div>
      )}

      {/* Privacy Note */}
      <p className="text-center text-xs text-slate-400 mt-6">
        By continuing, you agree to our Terms of Service and Privacy Policy.
        Your wallet is non-custodial and secure.
      </p>
    </div>
  );
}
