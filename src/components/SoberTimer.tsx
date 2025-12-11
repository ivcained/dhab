"use client";

import React, { useState, useEffect, useMemo } from "react";
import TimerView from "./sober-timer/TimerView";
import SetupView from "./sober-timer/SetupView";
import CommunityView from "./sober-timer/CommunityView";
import { generateAnonymousId } from "~/lib/community";

interface SoberTimerData {
  startDate: string;
  startTime: string;
  addiction: string;
  customAddiction: string;
  dailyCost: number;
}

interface TimerDisplay {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

type ViewType = "setup" | "timer" | "community";
type TimerTabType = "summary" | "savings";

export default function SoberTimer() {
  const [view, setView] = useState<ViewType>("setup");
  const [formData, setFormData] = useState<SoberTimerData>({
    startDate: "",
    startTime: "",
    addiction: "",
    customAddiction: "",
    dailyCost: 8,
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
  const [activeTimerTab, setActiveTimerTab] = useState<TimerTabType>("summary");
  const [isEditingCost, setIsEditingCost] = useState(false);
  const [tempCost, setTempCost] = useState("");

  // Generate anonymous ID based on device fingerprint + addiction
  const userAnonymousId = useMemo(() => {
    const seed = `${navigator.userAgent}-${formData.addiction}-${formData.startDate}`;
    return generateAnonymousId(seed);
  }, [formData.addiction, formData.startDate]);

  useEffect(() => {
    const saved = localStorage.getItem("soberTimerData");
    if (saved) {
      const parsed = JSON.parse(saved) as SoberTimerData;
      setFormData({ ...parsed, dailyCost: parsed.dailyCost || 8 });
      if (parsed.startDate && parsed.addiction) setView("timer");
    }
  }, []);

  useEffect(() => {
    if (view !== "timer" || !formData.startDate) return;
    const calculateTime = () => {
      const startDateTime = new Date(
        `${formData.startDate}T${formData.startTime || "00:00"}`
      );
      const diff = Date.now() - startDateTime.getTime();
      if (diff < 0) {
        setTimerDisplay({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimerDisplay({
        seconds: Math.floor(diff / 1000) % 60,
        minutes: Math.floor(diff / 60000) % 60,
        hours: Math.floor(diff / 3600000) % 24,
        days: Math.floor(diff / 86400000),
      });
    };
    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [view, formData.startDate, formData.startTime]);

  const handleStartTimer = () => {
    if (!formData.startDate) {
      alert("Please select a start date");
      return;
    }
    const addiction = showCustomInput
      ? formData.customAddiction
      : formData.addiction;
    if (!addiction) {
      alert("Please select or enter an addiction");
      return;
    }
    const data = { ...formData, addiction };
    localStorage.setItem("soberTimerData", JSON.stringify(data));
    setFormData(data);
    setView("timer");
  };

  const handleReset = () => {
    localStorage.removeItem("soberTimerData");
    setFormData({
      startDate: "",
      startTime: "",
      addiction: "",
      customAddiction: "",
      dailyCost: 8,
    });
    setView("setup");
    setShowCustomInput(false);
    setExpandedCategory(null);
    setSearchQuery("");
    setActiveTimerTab("summary");
  };

  const handleCostUpdate = () => {
    const newCost = parseFloat(tempCost);
    if (!isNaN(newCost) && newCost >= 0) {
      const data = { ...formData, dailyCost: newCost };
      setFormData(data);
      localStorage.setItem("soberTimerData", JSON.stringify(data));
    }
    setIsEditingCost(false);
  };

  if (view === "community") {
    return (
      <CommunityView
        addiction={formData.addiction}
        userAnonymousId={userAnonymousId}
        onBack={() => setView("timer")}
      />
    );
  }

  if (view === "timer") {
    return (
      <TimerView
        addiction={formData.addiction}
        startDate={formData.startDate}
        timerDisplay={timerDisplay}
        activeTab={activeTimerTab}
        setActiveTab={setActiveTimerTab}
        dailyCost={formData.dailyCost}
        isEditingCost={isEditingCost}
        tempCost={tempCost}
        setTempCost={setTempCost}
        setIsEditingCost={setIsEditingCost}
        handleCostUpdate={handleCostUpdate}
        handleReset={handleReset}
        onOpenCommunity={() => setView("community")}
      />
    );
  }

  return (
    <SetupView
      formData={formData}
      setFormData={setFormData}
      expandedCategory={expandedCategory}
      setExpandedCategory={setExpandedCategory}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      showCustomInput={showCustomInput}
      setShowCustomInput={setShowCustomInput}
      handleStartTimer={handleStartTimer}
    />
  );
}
