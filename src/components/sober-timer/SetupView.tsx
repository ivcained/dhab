"use client";

import React, { useMemo } from "react";
import { addictionCategories } from "~/lib/addictions";

interface FormData {
  startDate: string;
  startTime: string;
  addiction: string;
  customAddiction: string;
  dailyCost?: number;
  motivation?: string;
  pledgeDate?: string;
  walletAddress?: string;
  authStrategy?: string;
}

interface SetupViewProps {
  formData: FormData;
  setFormData: (updates: Partial<FormData>) => void;
  expandedCategory: string | null;
  setExpandedCategory: (val: string | null) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  showCustomInput: boolean;
  setShowCustomInput: (val: boolean) => void;
  handleStartTimer: () => void;
  onBack?: () => void;
}

export default function SetupView({
  formData,
  setFormData,
  expandedCategory,
  setExpandedCategory,
  searchQuery,
  setSearchQuery,
  showCustomInput,
  setShowCustomInput,
  handleStartTimer,
  onBack,
}: SetupViewProps) {
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return addictionCategories;
    const q = searchQuery.toLowerCase();
    return addictionCategories
      .map((c) => ({
        ...c,
        items: c.items.filter((i) => i.toLowerCase().includes(q)),
      }))
      .filter((c) => c.items.length > 0);
  }, [searchQuery]);

  const selectAddiction = (addiction: string) => {
    setFormData({ addiction });
    setShowCustomInput(false);
  };

  const toggleCategory = (name: string) =>
    setExpandedCategory(expandedCategory === name ? null : name);

  const getDisplayAddiction = () =>
    showCustomInput ? formData.customAddiction : formData.addiction;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="w-full max-w-lg mx-auto py-8 px-4">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          {onBack && (
            <button
              onClick={onBack}
              className="text-slate-400 hover:text-slate-600 text-2xl mr-4"
            >
              ←
            </button>
          )}
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Start Your Journey
            </h1>
            <p className="text-slate-500">
              Track your progress and stay motivated
            </p>
          </div>
          {onBack && <div className="w-8" />} {/* Spacer for alignment */}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">
            When did you start?
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ startDate: e.target.value })}
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Start Time (optional)
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ startTime: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">
            What are you quitting?
          </h2>

          {getDisplayAddiction() && (
            <div className="mb-4 p-3 bg-cyan-50 border border-cyan-200 rounded-xl flex items-center justify-between">
              <span className="font-medium text-cyan-800">
                {getDisplayAddiction()}
              </span>
              <button
                onClick={() => {
                  setFormData({ addiction: "", customAddiction: "" });
                  setShowCustomInput(false);
                }}
                className="text-cyan-600 hover:text-cyan-800"
              >
                ✕
              </button>
            </div>
          )}

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search addictions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
            {filteredCategories.map((category) => (
              <div
                key={category.name}
                className="border border-slate-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleCategory(category.name)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100"
                >
                  <span className="font-medium text-slate-700">
                    {category.name}
                  </span>
                  <span className="text-slate-400">
                    {expandedCategory === category.name ? "−" : "+"}
                  </span>
                </button>
                {expandedCategory === category.name && (
                  <div className="p-2 bg-white">
                    <div className="flex flex-wrap gap-2">
                      {category.items.map((item) => (
                        <button
                          key={item}
                          onClick={() => selectAddiction(item)}
                          className={`px-3 py-1.5 text-sm rounded-lg ${
                            formData.addiction === item
                              ? "bg-cyan-500 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-4">
            <button
              onClick={() => {
                setShowCustomInput(!showCustomInput);
                if (!showCustomInput) setFormData({ addiction: "" });
              }}
              className="text-cyan-600 hover:text-cyan-700 font-medium text-sm mb-3"
            >
              + Add custom addiction
            </button>
            {showCustomInput && (
              <input
                type="text"
                placeholder="Enter your addiction..."
                value={formData.customAddiction}
                onChange={(e) =>
                  setFormData({ customAddiction: e.target.value })
                }
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            )}
          </div>
        </div>

        <button
          onClick={handleStartTimer}
          disabled={
            !formData.startDate ||
            (!formData.addiction && !formData.customAddiction)
          }
          className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl font-semibold text-lg shadow-lg disabled:shadow-none"
        >
          Start My Journey
        </button>
      </div>
    </div>
  );
}
