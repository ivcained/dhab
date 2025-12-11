"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import TimerView from "./sober-timer/TimerView";
import SetupView from "./sober-timer/SetupView";
import CommunityView from "./sober-timer/CommunityView";
import PledgeView from "./sober-timer/PledgeView";
import { generateAnonymousId } from "~/lib/community";
import { useFrameContext } from "./providers/FrameProvider";

interface SoberTimerData {
  startDate: string;
  startTime: string;
  addiction: string;
  customAddiction: string;
  dailyCost: number;
  motivation?: string;
  pledgeDate?: string;
}

interface MiniAppContext {
  user?: {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
}

interface TimerDisplay {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

type ViewType = "pledge" | "setup" | "timer" | "community";
type TimerTabType = "summary" | "savings";

export default function SoberTimer() {
  const frameContext = useFrameContext();
  const [view, setView] = useState<ViewType>("pledge");
  const [formData, setFormData] = useState<SoberTimerData>({
    startDate: "",
    startTime: "",
    addiction: "",
    customAddiction: "",
    dailyCost: 8,
    motivation: "",
    pledgeDate: "",
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Get user FID from Farcaster context
  const userFid = useMemo(() => {
    const context = frameContext?.context as MiniAppContext | null;
    return context?.user?.fid || null;
  }, [frameContext]);

  // Generate anonymous ID based on FID + addiction (or device fingerprint as fallback)
  const userAnonymousId = useMemo(() => {
    const seed = userFid
      ? `fid-${userFid}-${formData.addiction}-${formData.startDate}`
      : `${typeof navigator !== "undefined" ? navigator.userAgent : "server"}-${
          formData.addiction
        }-${formData.startDate}`;
    return generateAnonymousId(seed);
  }, [userFid, formData.addiction, formData.startDate]);

  // Save data to database
  const saveToDatabase = useCallback(
    async (data: SoberTimerData) => {
      if (!userFid) return;

      setIsSaving(true);
      try {
        await fetch("/api/sobriety", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fid: userFid,
            ...data,
          }),
        });
      } catch (error) {
        console.error("Failed to save to database:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [userFid]
  );

  // Load data from database or localStorage
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // If user has FID, try to load from database first
      if (userFid) {
        try {
          const response = await fetch(`/api/sobriety?fid=${userFid}`);
          const result = await response.json();

          if (result.data) {
            const dbData: SoberTimerData = {
              startDate: result.data.startDate || "",
              startTime: result.data.startTime || "",
              addiction: result.data.addiction || "",
              customAddiction: result.data.customAddiction || "",
              dailyCost: result.data.dailyCost || 8,
              motivation: result.data.motivation || "",
              pledgeDate: result.data.pledgeDate || "",
            };
            setFormData(dbData);
            // Also save to localStorage as backup
            localStorage.setItem("soberTimerData", JSON.stringify(dbData));

            if (dbData.startDate && dbData.addiction) {
              setView("timer");
            } else if (
              dbData.pledgeDate === new Date().toISOString().split("T")[0]
            ) {
              setView("setup");
            }
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error("Failed to load from database:", error);
        }
      }

      // Fallback to localStorage
      const saved = localStorage.getItem("soberTimerData");
      if (saved) {
        const parsed = JSON.parse(saved) as SoberTimerData;
        setFormData({ ...parsed, dailyCost: parsed.dailyCost || 8 });
        if (parsed.startDate && parsed.addiction) {
          setView("timer");
        } else if (
          parsed.pledgeDate === new Date().toISOString().split("T")[0]
        ) {
          setView("setup");
        }

        // If we have FID and localStorage data, sync to database
        if (userFid && parsed.startDate && parsed.addiction) {
          saveToDatabase(parsed);
        }
      }

      setIsLoading(false);
    };

    // Wait for frame context to be available
    if (frameContext !== null) {
      loadData();
    }
  }, [userFid, frameContext, saveToDatabase]);

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

  const handleStartTimer = async () => {
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

    // If no time specified and date is today, use current time so timer starts at 00:00:00
    let startTime = formData.startTime;
    const today = new Date().toISOString().split("T")[0];
    if (!startTime && formData.startDate === today) {
      const now = new Date();
      startTime = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
    }

    const data = { ...formData, addiction, startTime };
    localStorage.setItem("soberTimerData", JSON.stringify(data));
    setFormData(data);

    // Save to database if user has FID
    await saveToDatabase(data);

    setView("timer");
  };

  const handleReset = async () => {
    // Delete from database if user has FID
    if (userFid) {
      try {
        await fetch(`/api/sobriety?fid=${userFid}`, { method: "DELETE" });
      } catch (error) {
        console.error("Failed to delete from database:", error);
      }
    }

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

  const handleCostUpdate = async () => {
    const newCost = parseFloat(tempCost);
    if (!isNaN(newCost) && newCost >= 0) {
      const data = { ...formData, dailyCost: newCost };
      setFormData(data);
      localStorage.setItem("soberTimerData", JSON.stringify(data));

      // Save to database if user has FID
      await saveToDatabase(data);
    }
    setIsEditingCost(false);
  };

  const handlePledgeConfirmed = async (motivation: string) => {
    const today = new Date().toISOString().split("T")[0];
    const updatedData = { ...formData, motivation, pledgeDate: today };
    setFormData(updatedData);
    localStorage.setItem("soberTimerData", JSON.stringify(updatedData));

    // Save to database if user has FID
    if (updatedData.startDate && updatedData.addiction) {
      await saveToDatabase(updatedData);
    }

    setView("setup");
  };

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading your journey...</p>
        </div>
      </div>
    );
  }

  if (view === "pledge") {
    return (
      <PledgeView
        onPledgeConfirmed={handlePledgeConfirmed}
        onClose={() => {
          // If user has existing data, allow them to skip pledge
          if (formData.startDate && formData.addiction) {
            setView("timer");
          }
        }}
      />
    );
  }

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
