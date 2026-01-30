"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema
const recurrenceRuleSchema = z.object({
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]),
  day_of_week: z.number().int().min(0).max(6).optional(), // 0=Sunday
  day_of_month: z.number().int().min(1).max(31).optional(),
  interval: z.number().int().min(1).default(1),
});

const scheduleSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional().nullable(),
  schedule_type: z.enum(["recurring", "one_time"]).default("recurring"),
  recurrence_rule: recurrenceRuleSchema.optional().nullable(),
  cutoff_hours_before: z.number().int().min(0).default(24),
  cutoff_time: z.string().default("23:59:59"),
  available_dates: z.array(z.string()).default([]),
  blocked_dates: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
});

type RecurrenceRule = z.infer<typeof recurrenceRuleSchema>;
type ScheduleFormData = z.infer<typeof scheduleSchema>;

// Get all schedules
export async function getSchedules(filters?: { is_active?: boolean }) {
  const supabase = await createClient();

  let query = supabase
    .from("schedules")
    .select("*")
    .order("name", { ascending: true });

  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching schedules:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get a single schedule with assignments
export async function getSchedule(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("schedules")
    .select(`
      *,
      schedule_assignments(
        *,
        fulfillment_locations(id, name),
        delivery_zones(id, name),
        shipping_zones(id, name)
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching schedule:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Create a new schedule
export async function createSchedule(formData: ScheduleFormData) {
  const supabase = await createClient();

  const validated = scheduleSchema.safeParse(formData);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0].message };
  }

  const { data, error } = await supabase
    .from("schedules")
    .insert(validated.data)
    .select()
    .single();

  if (error) {
    console.error("Error creating schedule:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/fulfillment");

  return { data, error: null };
}

// Update a schedule
export async function updateSchedule(
  id: string,
  formData: Partial<ScheduleFormData>
) {
  const supabase = await createClient();

  const validated = scheduleSchema.partial().safeParse(formData);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0].message };
  }

  const { data, error } = await supabase
    .from("schedules")
    .update(validated.data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating schedule:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/fulfillment");
  revalidatePath(`/admin/fulfillment/schedules/${id}`);

  return { data, error: null };
}

// Delete a schedule
export async function deleteSchedule(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("schedules")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting schedule:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/fulfillment");

  return { success: true, error: null };
}

// Toggle schedule active status
export async function toggleScheduleActive(id: string) {
  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("schedules")
    .select("is_active")
    .eq("id", id)
    .single();

  if (fetchError) {
    return { data: null, error: fetchError.message };
  }

  const { data, error } = await supabase
    .from("schedules")
    .update({ is_active: !current.is_active })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error toggling schedule status:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/fulfillment");

  return { data, error: null };
}

// Assign schedule to a location/zone
export async function assignSchedule(
  scheduleId: string,
  assignment: {
    fulfillment_location_id?: string;
    delivery_zone_id?: string;
    shipping_zone_id?: string;
  }
) {
  const supabase = await createClient();

  // Ensure only one type is provided
  const count =
    (assignment.fulfillment_location_id ? 1 : 0) +
    (assignment.delivery_zone_id ? 1 : 0) +
    (assignment.shipping_zone_id ? 1 : 0);

  if (count !== 1) {
    return { data: null, error: "Must specify exactly one location or zone" };
  }

  const { data, error } = await supabase
    .from("schedule_assignments")
    .insert({
      schedule_id: scheduleId,
      ...assignment,
    })
    .select()
    .single();

  if (error) {
    console.error("Error assigning schedule:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/fulfillment");

  return { data, error: null };
}

// Remove schedule assignment
export async function removeScheduleAssignment(assignmentId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("schedule_assignments")
    .delete()
    .eq("id", assignmentId);

  if (error) {
    console.error("Error removing schedule assignment:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/fulfillment");

  return { success: true, error: null };
}

// Get schedules for a fulfillment location
export async function getSchedulesForLocation(locationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("schedule_assignments")
    .select("schedules(*)")
    .eq("fulfillment_location_id", locationId);

  if (error) {
    console.error("Error fetching location schedules:", error);
    return { data: null, error: error.message };
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: data?.map((a: any) => a.schedules).filter(Boolean) || [],
    error: null,
  };
}

// Get schedules for a delivery zone
export async function getSchedulesForDeliveryZone(zoneId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("schedule_assignments")
    .select("schedules(*)")
    .eq("delivery_zone_id", zoneId);

  if (error) {
    console.error("Error fetching delivery zone schedules:", error);
    return { data: null, error: error.message };
  }

  return {
    data: data?.map((a: any) => a.schedules).filter(Boolean) || [],
    error: null,
  };
}

// Get schedules for a shipping zone
export async function getSchedulesForShippingZone(zoneId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("schedule_assignments")
    .select("schedules(*)")
    .eq("shipping_zone_id", zoneId);

  if (error) {
    console.error("Error fetching shipping zone schedules:", error);
    return { data: null, error: error.message };
  }

  return {
    data: data?.map((a: any) => a.schedules).filter(Boolean) || [],
    error: null,
  };
}

// Calculate available dates for a schedule
export async function getAvailableDates(
  scheduleId: string,
  startDate: Date = new Date(),
  endDate?: Date
) {
  const { data: schedule, error } = await getSchedule(scheduleId);

  if (error || !schedule) {
    return { dates: [], error: error || "Schedule not found" };
  }

  const dates: Date[] = [];
  const end = endDate || new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days out
  const blockedSet = new Set(schedule.blocked_dates || []);

  if (schedule.schedule_type === "one_time") {
    // For one-time schedules, return available_dates that aren't blocked
    for (const dateStr of schedule.available_dates || []) {
      const date = new Date(dateStr);
      if (date >= startDate && date <= end && !blockedSet.has(dateStr)) {
        dates.push(date);
      }
    }
  } else if (schedule.recurrence_rule) {
    // For recurring schedules, calculate based on recurrence rule
    const rule = schedule.recurrence_rule as RecurrenceRule;
    const current = new Date(startDate);

    while (current <= end && dates.length < 30) {
      const dateStr = current.toISOString().split("T")[0];

      if (!blockedSet.has(dateStr)) {
        let isValidDate = false;

        switch (rule.frequency) {
          case "daily":
            isValidDate = true;
            break;
          case "weekly":
            isValidDate = rule.day_of_week === current.getDay();
            break;
          case "biweekly":
            // Check if this is the right week
            const weekNum = Math.floor(
              (current.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
            );
            isValidDate =
              rule.day_of_week === current.getDay() && weekNum % 2 === 0;
            break;
          case "monthly":
            isValidDate = rule.day_of_month === current.getDate();
            break;
        }

        if (isValidDate) {
          // Check cutoff
          const cutoffDate = new Date(current);
          cutoffDate.setHours(
            cutoffDate.getHours() - (schedule.cutoff_hours_before || 24)
          );

          if (cutoffDate > new Date()) {
            dates.push(new Date(current));
          }
        }
      }

      current.setDate(current.getDate() + 1);
    }
  }

  return { dates, error: null };
}

// Get available dates for a fulfillment type (pickup location, delivery zone, or shipping zone)
export async function getAvailableDatesForFulfillment(
  fulfillmentType: "pickup" | "delivery" | "shipping",
  id: string // locationId for pickup, zoneId for delivery/shipping
): Promise<{ dates: string[]; error: string | null }> {
  let schedulesResult;

  // Get schedules based on fulfillment type
  if (fulfillmentType === "pickup") {
    schedulesResult = await getSchedulesForLocation(id);
  } else if (fulfillmentType === "delivery") {
    schedulesResult = await getSchedulesForDeliveryZone(id);
  } else {
    schedulesResult = await getSchedulesForShippingZone(id);
  }

  if (schedulesResult.error) {
    return { dates: [], error: schedulesResult.error };
  }

  const schedules = schedulesResult.data || [];

  // If no schedules assigned, return empty
  if (schedules.length === 0) {
    return { dates: [], error: null };
  }

  // Collect dates from all schedules
  const allDates: Date[] = [];
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() + 1); // Start from tomorrow

  for (const schedule of schedules) {
    if (!schedule.is_active) continue;

    const { dates } = await getAvailableDates(schedule.id, startDate);
    allDates.push(...dates);
  }

  // Deduplicate and sort dates
  const uniqueDateStrings = [...new Set(allDates.map((d) => d.toISOString().split("T")[0]))];
  uniqueDateStrings.sort();

  return { dates: uniqueDateStrings, error: null };
}

// Add blocked date to schedule
export async function addBlockedDate(scheduleId: string, date: string) {
  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("schedules")
    .select("blocked_dates")
    .eq("id", scheduleId)
    .single();

  if (fetchError) {
    return { data: null, error: fetchError.message };
  }

  const blockedDates = [...(current.blocked_dates || []), date];
  const uniqueDates = [...new Set(blockedDates)];

  const { data, error } = await supabase
    .from("schedules")
    .update({ blocked_dates: uniqueDates })
    .eq("id", scheduleId)
    .select()
    .single();

  if (error) {
    console.error("Error adding blocked date:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/fulfillment");

  return { data, error: null };
}

// Get schedule assignments for a location/zone (returns assignment IDs for removal)
export async function getScheduleAssignments(params: {
  fulfillment_location_id?: string;
  delivery_zone_id?: string;
  shipping_zone_id?: string;
}): Promise<{
  data: Array<{ id: string; schedule_id: string }> | null;
  error: string | null;
}> {
  const supabase = await createClient();

  let query = (supabase as any)
    .from("schedule_assignments")
    .select("id, schedule_id");

  if (params.fulfillment_location_id) {
    query = query.eq("fulfillment_location_id", params.fulfillment_location_id);
  } else if (params.delivery_zone_id) {
    query = query.eq("delivery_zone_id", params.delivery_zone_id);
  } else if (params.shipping_zone_id) {
    query = query.eq("shipping_zone_id", params.shipping_zone_id);
  } else {
    return { data: null, error: "Must specify a location or zone" };
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching schedule assignments:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Remove blocked date from schedule
export async function removeBlockedDate(scheduleId: string, date: string) {
  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("schedules")
    .select("blocked_dates")
    .eq("id", scheduleId)
    .single();

  if (fetchError) {
    return { data: null, error: fetchError.message };
  }

  const blockedDates = (current.blocked_dates || []).filter(
    (d: string) => d !== date
  );

  const { data, error } = await supabase
    .from("schedules")
    .update({ blocked_dates: blockedDates })
    .eq("id", scheduleId)
    .select()
    .single();

  if (error) {
    console.error("Error removing blocked date:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/fulfillment");

  return { data, error: null };
}
