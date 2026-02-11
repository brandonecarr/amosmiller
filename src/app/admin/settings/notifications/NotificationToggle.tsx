"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateNotificationSetting } from "@/lib/actions/notification-settings";

interface NotificationToggleProps {
  settingId?: string;
  eventType: string;
  initialEnabled: boolean;
}

export function NotificationToggle({
  settingId,
  eventType,
  initialEnabled,
}: NotificationToggleProps) {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [isLoading, setIsLoading] = useState(false);

  async function handleToggle() {
    if (!settingId) return;

    setIsLoading(true);
    const newValue = !isEnabled;

    const { error } = await updateNotificationSetting(settingId, {
      is_enabled: newValue,
    });

    if (!error) {
      setIsEnabled(newValue);
      router.refresh();
    } else {
      console.error("Failed to update notification setting:", error);
    }

    setIsLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        relative inline-flex h-8 w-14 items-center rounded-full transition-colors
        ${isEnabled ? "bg-green-600" : "bg-slate-300"}
        ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
      aria-pressed={isEnabled}
      aria-label={`Toggle ${eventType} notifications ${isEnabled ? "off" : "on"}`}
    >
      <span
        className={`
          inline-block h-6 w-6 transform rounded-full bg-white transition-transform
          ${isEnabled ? "translate-x-7" : "translate-x-1"}
        `}
      />
    </button>
  );
}
