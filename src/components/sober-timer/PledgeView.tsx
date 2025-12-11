"use client";

import React, { useState } from "react";
import WalletLogin from "~/components/wallet/WalletLogin";
import { useFrameContext } from "~/components/providers/FrameProvider";

interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface MiniAppContext {
  user?: FarcasterUser;
}

interface PledgeViewProps {
  onPledgeConfirmed: (motivation: string, walletAddress?: string) => void;
  onClose: () => void;
}

const motivationOptions = [
  {
    id: "kids",
    text: "For my kids to have a present father.",
    type: "image",
    bgColor: "bg-gradient-to-b from-amber-100 to-green-100",
  },
  {
    id: "family",
    text: "I want my family to respect me.",
    type: "text",
    bgColor: "bg-indigo-400",
    textColor: "text-white",
  },
  {
    id: "hangovers",
    text: "No more hangovers! 💪",
    type: "text",
    bgColor: "bg-emerald-400",
    textColor: "text-white",
  },
  {
    id: "partner",
    text: "To rebuild trust with my partner.",
    type: "image",
    bgColor: "bg-gradient-to-b from-slate-600 to-slate-700",
  },
  {
    id: "health",
    text: "Physical health & fitness",
    type: "image",
    bgColor: "bg-gradient-to-b from-green-200 to-green-300",
  },
  {
    id: "better",
    text: "I feel so much better",
    type: "text",
    bgColor: "bg-cyan-100",
    textColor: "text-cyan-600",
  },
  {
    id: "money",
    text: "Save money for things I love",
    type: "text",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-700",
  },
  {
    id: "mental",
    text: "Better mental clarity",
    type: "text",
    bgColor: "bg-purple-100",
    textColor: "text-purple-700",
  },
];

const getDayName = () => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[new Date().getDay()];
};

type PledgeStep = "login" | "pledge";

export default function PledgeView({
  onPledgeConfirmed,
  onClose,
}: PledgeViewProps) {
  const frameContext = useFrameContext();
  const [step, setStep] = useState<PledgeStep>("login");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [authStrategy, setAuthStrategy] = useState<string | null>(null);
  const [selectedMotivations, setSelectedMotivations] = useState<string[]>([]);
  const [pledgeAccepted, setPledgeAccepted] = useState(false);

  // Extract Farcaster user from frame context
  const isInMiniApp = frameContext?.isInMiniApp ?? false;
  const farcasterUser = isInMiniApp
    ? (frameContext?.context as MiniAppContext)?.user ?? null
    : null;

  const handleWalletConnected = (address: string, strategy: string) => {
    setWalletAddress(address);
    setAuthStrategy(strategy);
    // Save to localStorage for persistence
    localStorage.setItem("walletAddress", address);
    localStorage.setItem("authStrategy", strategy);
    // Move to pledge step
    setStep("pledge");
  };

  const handleSkipLogin = () => {
    setStep("pledge");
  };

  const toggleMotivation = (id: string) => {
    setSelectedMotivations((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleConfirmPledge = () => {
    if (selectedMotivations.length > 0) {
      const motivationTexts = selectedMotivations
        .map((id) => motivationOptions.find((m) => m.id === id)?.text)
        .filter(Boolean)
        .join(", ");
      onPledgeConfirmed(motivationTexts, walletAddress || undefined);
    }
  };

  // Login Step
  if (step === "login") {
    return (
      <div className="min-h-screen bg-white">
        <div className="w-full max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
            <button onClick={onClose} className="text-slate-400 text-2xl">
              ✕
            </button>
            <h1 className="text-sm font-semibold text-slate-500 tracking-wide uppercase">
              Welcome
            </h1>
            <div className="w-8" />
          </div>

          {/* Logo/Branding */}
          <div className="px-6 py-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-4xl">🌟</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Sober Timer
            </h1>
            <p className="text-slate-500">
              Track your journey to a healthier life
            </p>
          </div>

          {/* Wallet Login */}
          <div className="px-6 pb-8">
            <WalletLogin
              onConnected={handleWalletConnected}
              onSkip={handleSkipLogin}
              farcasterUser={farcasterUser}
              isInMiniApp={isInMiniApp}
            />
          </div>

          {/* Features Preview */}
          <div className="px-6 pb-8">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3">
                <div className="text-2xl mb-1">⏱️</div>
                <p className="text-xs text-slate-500">Track Time</p>
              </div>
              <div className="p-3">
                <div className="text-2xl mb-1">💰</div>
                <p className="text-xs text-slate-500">Save Money</p>
              </div>
              <div className="p-3">
                <div className="text-2xl mb-1">👥</div>
                <p className="text-xs text-slate-500">Community</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pledge Step
  return (
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
          <button
            onClick={() => setStep("login")}
            className="text-slate-400 text-2xl"
          >
            ←
          </button>
          <h1 className="text-sm font-semibold text-slate-500 tracking-wide uppercase">
            Pledge for {getDayName()}
          </h1>
          <div className="w-8">
            {walletAddress && (
              <div
                className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"
                title={`Connected: ${walletAddress}`}
              >
                <span className="text-green-600 text-xs">✓</span>
              </div>
            )}
          </div>
        </div>

        {/* Connected Wallet Badge */}
        {walletAddress && (
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Connected via {authStrategy}</span>
              <span className="font-mono text-xs text-slate-400">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            </div>
          </div>
        )}

        <div className="px-4 py-6">
          {/* Pledge Card */}
          <button
            onClick={() => setPledgeAccepted(!pledgeAccepted)}
            className={`w-full p-6 rounded-2xl mb-4 flex items-center justify-between transition-all ${
              pledgeAccepted
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg"
                : "bg-slate-700"
            }`}
          >
            <span className="text-xl font-semibold text-white">
              Today, I will stay sober
            </span>
            <div
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                pledgeAccepted ? "border-white bg-white/20" : "border-slate-500"
              }`}
            >
              {pledgeAccepted && <span className="text-white">✓</span>}
            </div>
          </button>

          {/* Pagination dots */}
          <div className="flex justify-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-slate-300" />
            <div className="w-2 h-2 rounded-full bg-cyan-500" />
            <div className="w-2 h-2 rounded-full bg-slate-300" />
          </div>

          {/* Why I'm doing this */}
          <h2 className="text-xl font-semibold text-slate-800 text-center mb-6">
            Why I&apos;m doing this
          </h2>

          {/* Motivation Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {motivationOptions.map((option, index) => (
              <button
                key={option.id}
                onClick={() => toggleMotivation(option.id)}
                className={`relative rounded-2xl overflow-hidden transition-all ${
                  selectedMotivations.includes(option.id)
                    ? "ring-4 ring-cyan-500 ring-offset-2"
                    : ""
                } ${option.bgColor} ${
                  index === 0 || index === 3 ? "row-span-2 h-48" : "h-24"
                }`}
              >
                {option.type === "image" ? (
                  <div className="absolute inset-0 flex items-end p-4">
                    <p
                      className={`font-medium text-left ${
                        option.id === "partner" || option.id === "kids"
                          ? "text-white"
                          : "text-slate-700"
                      }`}
                    >
                      {option.text}
                    </p>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center p-4">
                    <p
                      className={`font-medium text-center ${
                        option.textColor || "text-slate-700"
                      }`}
                    >
                      {option.text}
                    </p>
                  </div>
                )}
                {selectedMotivations.includes(option.id) && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Confirm Pledge Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleConfirmPledge}
              disabled={!pledgeAccepted || selectedMotivations.length === 0}
              className="w-full py-4 px-6 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-full font-semibold text-lg transition-all shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
            >
              Confirm Pledge
              <span className="text-xl">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
