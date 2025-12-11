"use client";

import React, { useState, useEffect, useMemo } from "react";
import { addictionCategories } from "~/lib/addictions";

interface SoberTimerData {
  startDate: string;
  startTime: string;
  addiction: string;
  customAddiction: string;
}

interface TimerDisplay {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

type ViewType = "setup" | "timer";

export default function SoberTimer() {
  const [view, setView] = useState<ViewType>("setup");
  const [formData, setFormData] = useState<SoberTimerData>({
    startDate: "",
    startTime: "",
    addiction: "",
    customAddiction: "",
  });
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [timerDisplay, setTimerDisplay] = useState<TimerDisplay>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Load saved data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("soberTimerData");
    if (saved) {
      const parsed = JSON.parse(saved) as SoberTimerData;
      setFormData(parsed);
      if (parsed.startDate && parsed.addiction) {
        setView("timer");
      }
    }
  }, []);

  // Timer calculation
  useEffect(() => {
    if (view !== "timer" || !formData.startDate) return;

    const calculateTime = () => {
      const startDateTime = new Date(
        `${formData.startDate}T${formData.startTime || "00:00"}`
      );
      const now = new Date();
      const diff = now.getTime() - startDateTime.getTime();

      if (diff < 0) {
        setTimerDisplay({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const seconds = Math.floor(diff / 1000) % 60;
      const minutes = Math.floor(diff / (1000 * 60)) % 60;
      const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      setTimerDisplay({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [view, formData.startDate, formData.startTime]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return addictionCategories;

    const lowerQuery = searchQuery.toLowerCase();
    return addictionCategories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) =>
          item.toLowerCase().includes(lowerQuery)
        ),
      }))
      .filter((category) => category.items.length > 0);
  }, [searchQuery]);

  const handleStartTimer = () => {
    if (!formData.startDate) {
      alert("Please select a start date");
      return;
    }
    const selectedAddiction = showCustomInput
      ? formData.customAddiction
      : formData.addiction;
    if (!selectedAddiction) {
      alert("Please select or enter an addiction");
      return;
    }

    const dataToSave = {
      ...formData,
      addiction: selectedAddiction,
    };
    localStorage.setItem("soberTimerData", JSON.stringify(dataToSave));
    setFormData(dataToSave);
    setView("timer");
  };

  const handleReset = () => {
    localStorage.removeItem("soberTimerData");
    setFormData({
      startDate: "",
      startTime: "",
      addiction: "",
      customAddiction: "",
    });
    setView("setup");
    setShowCustomInput(false);
    setExpandedCategory(null);
    setSearchQuery("");
  };

  const selectAddiction = (addiction: string) => {
    setFormData((prev) => ({ ...prev, addiction }));
    setShowCustomInput(false);
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategory((prev) =>
      prev === categoryName ? null : categoryName
    );
  };

  const getDisplayAddiction = () => {
    return showCustomInput ? formData.customAddiction : formData.addiction;
  };

  // Timer View
  if (view === "timer") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="w-full max-w-lg mx-auto py-8 px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200 mb-4">
              <span className="text-lg">»</span>
              <span className="font-semibold text-slate-800">
                {formData.addiction}
              </span>
            </div>
          </div>

          {/* Main Timer Display */}
          <div className="text-center mb-6">
            <p className="text-slate-500 mb-6">
              I&apos;ve been {formData.addiction.toLowerCase()} free for
            </p>

            {/* Circular Timer */}
            <div className="relative w-64 h-64 mx-auto mb-8">
              {/* Outer rings */}
              <svg className="w-full h-full" viewBox="0 0 200 200">
                {/* Background circles */}
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="75"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="6"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="62"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="5"
                />

                {/* Progress circles */}
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="url(#gradient1)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(timerDisplay.days % 30) * 18.85} 565.5`}
                  transform="rotate(-90 100 100)"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="75"
                  fill="none"
                  stroke="url(#gradient2)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${timerDisplay.hours * 19.63} 471`}
                  transform="rotate(-90 100 100)"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="62"
                  fill="none"
                  stroke="url(#gradient3)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${timerDisplay.minutes * 6.49} 389.6`}
                  transform="rotate(-90 100 100)"
                />

                {/* Gradients */}
                <defs>
                  <linearGradient
                    id="gradient1"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                  <linearGradient
                    id="gradient2"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                  <linearGradient
                    id="gradient3"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-slate-900 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-cyan-400">
                    {timerDisplay.days}
                  </span>
                  <span className="text-cyan-400 text-sm">days</span>
                </div>
              </div>
            </div>

            {/* Time breakdown */}
            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <span className="text-3xl font-bold text-cyan-500">
                  {timerDisplay.hours}
                </span>
                <p className="text-slate-500 text-sm">hours</p>
              </div>
              <div className="text-center">
                <span className="text-3xl font-bold text-cyan-500">
                  {timerDisplay.minutes}
                </span>
                <p className="text-slate-500 text-sm">minutes</p>
              </div>
              <div className="text-center">
                <span className="text-3xl font-bold text-cyan-500">
                  {timerDisplay.seconds}
                </span>
                <p className="text-slate-500 text-sm">seconds</p>
              </div>
            </div>
          </div>

          {/* Milestone Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="font-semibold text-slate-800 mb-4">
              Last milestone
            </h3>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                <span className="text-cyan-600">🏆</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800">
                  {timerDisplay.days >= 21
                    ? "3 Weeks"
                    : timerDisplay.days >= 14
                    ? "2 Weeks"
                    : timerDisplay.days >= 7
                    ? "1 Week"
                    : timerDisplay.days >= 1
                    ? `${timerDisplay.days} Day${
                        timerDisplay.days > 1 ? "s" : ""
                      }`
                    : "Just Started"}
                </p>
                <p className="text-sm text-slate-500">
                  Started:{" "}
                  {new Date(formData.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
          >
            Reset Timer
          </button>
        </div>
      </div>
    );
  }

  // Setup View
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full max-w-lg mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Start Your Journey
          </h1>
          <p className="text-slate-500">
            Track your progress and stay motivated
          </p>
        </div>

        {/* Date & Time Selection */}
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
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Start Time (optional)
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startTime: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Addiction Selection */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">
            What are you quitting?
          </h2>

          {/* Selected addiction display */}
          {getDisplayAddiction() && (
            <div className="mb-4 p-3 bg-cyan-50 border border-cyan-200 rounded-xl flex items-center justify-between">
              <span className="font-medium text-cyan-800">
                {getDisplayAddiction()}
              </span>
              <button
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    addiction: "",
                    customAddiction: "",
                  }));
                  setShowCustomInput(false);
                }}
                className="text-cyan-600 hover:text-cyan-800"
              >
                ✕
              </button>
            </div>
          )}

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search addictions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          {/* Categories */}
          <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
            {filteredCategories.map((category) => (
              <div
                key={category.name}
                className="border border-slate-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleCategory(category.name)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
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
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
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

          {/* Custom Addiction */}
          <div className="border-t border-slate-200 pt-4">
            <button
              onClick={() => {
                setShowCustomInput(!showCustomInput);
                if (!showCustomInput) {
                  setFormData((prev) => ({ ...prev, addiction: "" }));
                }
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
                  setFormData((prev) => ({
                    ...prev,
                    customAddiction: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            )}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartTimer}
          disabled={
            !formData.startDate ||
            (!formData.addiction && !formData.customAddiction)
          }
          className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl font-semibold text-lg transition-all shadow-lg disabled:shadow-none"
        >
          Start My Journey
        </button>
      </div>
    </div>
  );
}
