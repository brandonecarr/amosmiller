"use client";

import { useState, useEffect, useTransition } from "react";
import { Calendar, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAvailableDatesForFulfillment } from "@/lib/actions/schedules";

interface DateSelectorProps {
  fulfillmentType: "pickup" | "delivery" | "shipping";
  locationId: string | null;
  zoneId: string | null;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

export function DateSelector({
  fulfillmentType,
  locationId,
  zoneId,
  selectedDate,
  onSelectDate,
}: DateSelectorProps) {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isPending, startTransition] = useTransition();

  // Fetch available dates from the schedules API
  useEffect(() => {
    const fetchDates = async () => {
      setLoading(true);
      setError(null);

      const id = fulfillmentType === "pickup" ? locationId : zoneId;
      if (!id) {
        setLoading(false);
        return;
      }

      startTransition(async () => {
        const result = await getAvailableDatesForFulfillment(fulfillmentType, id);

        if (result.error) {
          setError(result.error);
          setAvailableDates([]);
        } else if (result.dates.length === 0) {
          // No schedules assigned - show a message but don't error
          setAvailableDates([]);
        } else {
          setAvailableDates(result.dates);
        }
        setLoading(false);
      });
    };

    if (
      (fulfillmentType === "pickup" && locationId) ||
      ((fulfillmentType === "delivery" || fulfillmentType === "shipping") && zoneId)
    ) {
      fetchDates();
    }
  }, [fulfillmentType, locationId, zoneId]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    return { daysInMonth, startingDay };
  };

  const isDateAvailable = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return availableDates.includes(dateStr);
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    const dateStr = date.toISOString().split("T")[0];
    return selectedDate === dateStr;
  };

  const handleDateClick = (date: Date) => {
    if (isDateAvailable(date)) {
      onSelectDate(date.toISOString().split("T")[0]);
    }
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);

  const prevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newMonth >= today || newMonth.getMonth() === today.getMonth()) {
      setCurrentMonth(newMonth);
    }
  };

  const nextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const monthYear = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get next available dates for quick selection
  const nextAvailableDates = availableDates.slice(0, 4).map((d) => new Date(d + "T00:00:00"));

  const fulfillmentLabel =
    fulfillmentType === "pickup"
      ? "Pickup"
      : fulfillmentType === "delivery"
      ? "Delivery"
      : "Shipping";

  if (loading || isPending) {
    return (
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
        <h3 className="font-semibold text-[var(--color-charcoal)] mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Select {fulfillmentLabel} Date
        </h3>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-500)]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
        <h3 className="font-semibold text-[var(--color-charcoal)] mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Select {fulfillmentLabel} Date
        </h3>
        <div className="flex items-center gap-3 p-4 bg-[var(--color-error-50)] text-[var(--color-error)] rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (availableDates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
        <h3 className="font-semibold text-[var(--color-charcoal)] mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Select {fulfillmentLabel} Date
        </h3>
        <div className="flex items-center gap-3 p-4 bg-[var(--color-warning-50)] text-[var(--color-warning-700)] rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">No available dates</p>
            <p className="text-sm opacity-80">
              No {fulfillmentLabel.toLowerCase()} schedules have been configured for this{" "}
              {fulfillmentType === "pickup" ? "location" : "zone"}. Please contact us or try a
              different {fulfillmentType === "pickup" ? "pickup location" : "fulfillment option"}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
      <h3 className="font-semibold text-[var(--color-charcoal)] mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Select {fulfillmentLabel} Date
      </h3>

      {/* Quick Select Dates */}
      {nextAvailableDates.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-[var(--color-muted)] mb-3">Next available dates:</p>
          <div className="flex flex-wrap gap-2">
            {nextAvailableDates.map((date) => (
              <button
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  isDateSelected(date)
                    ? "bg-[var(--color-primary-500)] text-white"
                    : "bg-[var(--color-slate-100)] text-[var(--color-charcoal)] hover:bg-[var(--color-slate-200)]"
                )}
              >
                {date.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="border-t border-[var(--color-border)] pt-6">
        <p className="text-sm text-[var(--color-muted)] mb-4">Or choose from calendar:</p>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            disabled={
              currentMonth.getMonth() === today.getMonth() &&
              currentMonth.getFullYear() === today.getFullYear()
            }
            className="p-2 hover:bg-[var(--color-slate-100)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium text-[var(--color-charcoal)]">{monthYear}</span>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-[var(--color-slate-100)] rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-[var(--color-muted)] py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before the 1st */}
          {Array.from({ length: startingDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const date = new Date(
              currentMonth.getFullYear(),
              currentMonth.getMonth(),
              i + 1
            );
            const isAvailable = isDateAvailable(date);
            const isSelected = isDateSelected(date);
            const isPast = date < today;

            return (
              <button
                key={i}
                onClick={() => handleDateClick(date)}
                disabled={!isAvailable || isPast}
                className={cn(
                  "h-10 rounded-lg text-sm font-medium transition-colors",
                  isSelected
                    ? "bg-[var(--color-primary-500)] text-white"
                    : isAvailable && !isPast
                    ? "bg-[var(--color-primary-100)] text-[var(--color-primary-700)] hover:bg-[var(--color-primary-200)]"
                    : "text-[var(--color-muted)] cursor-not-allowed"
                )}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[var(--color-primary-100)]" />
            <span className="text-xs text-[var(--color-muted)]">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[var(--color-primary-500)]" />
            <span className="text-xs text-[var(--color-muted)]">Selected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
