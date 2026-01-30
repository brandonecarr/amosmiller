"use client";

import { useState, useEffect, useTransition } from "react";
import {
  MapPin,
  Truck,
  Package,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge } from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";
import {
  getFulfillmentLocations,
  createFulfillmentLocation,
  updateFulfillmentLocation,
  deleteFulfillmentLocation,
  toggleFulfillmentLocationActive,
} from "@/lib/actions/fulfillment-locations";
import {
  getDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  toggleDeliveryZoneActive,
} from "@/lib/actions/delivery-zones";
import {
  getShippingZones,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
  toggleShippingZoneActive,
} from "@/lib/actions/shipping-zones";
import { US_STATES } from "@/lib/constants/us-states";
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  toggleScheduleActive,
} from "@/lib/actions/schedules";

type TabType = "locations" | "delivery" | "shipping" | "schedules";

interface FulfillmentLocation {
  id: string;
  name: string;
  slug: string;
  type: "pickup" | "delivery" | "shipping";
  description: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  is_active: boolean;
  is_coop: boolean;
}

interface DeliveryZone {
  id: string;
  name: string;
  slug: string;
  zip_codes: string[];
  delivery_fee: number;
  min_order_amount: number | null;
  free_delivery_threshold: number | null;
  is_active: boolean;
}

interface ShippingZone {
  id: string;
  name: string;
  slug: string;
  states: string[];
  base_rate: number;
  per_lb_rate: number;
  carrier: string;
  is_active: boolean;
}

interface Schedule {
  id: string;
  name: string;
  description: string | null;
  schedule_type: "recurring" | "one_time";
  recurrence_rule: {
    frequency: string;
    day_of_week?: number;
  } | null;
  cutoff_hours_before: number;
  is_active: boolean;
}

const tabs = [
  { id: "locations" as const, label: "Pickup Locations", icon: MapPin },
  { id: "delivery" as const, label: "Delivery Zones", icon: Truck },
  { id: "shipping" as const, label: "Shipping Zones", icon: Package },
  { id: "schedules" as const, label: "Schedules", icon: Calendar },
];

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function FulfillmentPage() {
  const [activeTab, setActiveTab] = useState<TabType>("locations");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [locations, setLocations] = useState<FulfillmentLocation[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [locationsRes, deliveryRes, shippingRes, schedulesRes] = await Promise.all([
      getFulfillmentLocations(),
      getDeliveryZones(),
      getShippingZones(),
      getSchedules(),
    ]);

    if (locationsRes.data) setLocations(locationsRes.data);
    if (deliveryRes.data) setDeliveryZones(deliveryRes.data);
    if (shippingRes.data) setShippingZones(shippingRes.data);
    if (schedulesRes.data) setSchedules(schedulesRes.data);

    setIsLoading(false);
  };

  const handleOpenModal = (item?: any) => {
    setEditingItem(item || null);
    setIsModalOpen(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setError(null);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };

  // Location handlers
  const handleSaveLocation = async (formData: any) => {
    startTransition(async () => {
      const data = {
        ...formData,
        slug: formData.slug || generateSlug(formData.name),
      };

      let result;
      if (editingItem) {
        result = await updateFulfillmentLocation(editingItem.id, data);
      } else {
        result = await createFulfillmentLocation(data);
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      handleCloseModal();
      loadData();
    });
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;
    startTransition(async () => {
      const result = await deleteFulfillmentLocation(id);
      if (result.error) setError(result.error);
      else loadData();
    });
  };

  const handleToggleLocation = async (id: string) => {
    startTransition(async () => {
      const result = await toggleFulfillmentLocationActive(id);
      if (result.error) setError(result.error);
      else loadData();
    });
  };

  // Delivery zone handlers
  const handleSaveDeliveryZone = async (formData: any) => {
    startTransition(async () => {
      const data = {
        ...formData,
        slug: formData.slug || generateSlug(formData.name),
        zip_codes: formData.zip_codes_text
          ? formData.zip_codes_text.split(/[,\n]/).map((z: string) => z.trim()).filter(Boolean)
          : formData.zip_codes || [],
        delivery_fee: parseFloat(formData.delivery_fee) || 0,
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
        free_delivery_threshold: formData.free_delivery_threshold
          ? parseFloat(formData.free_delivery_threshold)
          : null,
      };
      delete data.zip_codes_text;

      let result;
      if (editingItem) {
        result = await updateDeliveryZone(editingItem.id, data);
      } else {
        result = await createDeliveryZone(data);
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      handleCloseModal();
      loadData();
    });
  };

  const handleDeleteDeliveryZone = async (id: string) => {
    if (!confirm("Are you sure you want to delete this delivery zone?")) return;
    startTransition(async () => {
      const result = await deleteDeliveryZone(id);
      if (result.error) setError(result.error);
      else loadData();
    });
  };

  const handleToggleDeliveryZone = async (id: string) => {
    startTransition(async () => {
      const result = await toggleDeliveryZoneActive(id);
      if (result.error) setError(result.error);
      else loadData();
    });
  };

  // Shipping zone handlers
  const handleSaveShippingZone = async (formData: any) => {
    startTransition(async () => {
      const data = {
        ...formData,
        slug: formData.slug || generateSlug(formData.name),
        base_rate: parseFloat(formData.base_rate) || 0,
        per_lb_rate: parseFloat(formData.per_lb_rate) || 0,
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
        max_weight: formData.max_weight ? parseFloat(formData.max_weight) : null,
        estimated_days_min: formData.estimated_days_min ? parseInt(formData.estimated_days_min) : null,
        estimated_days_max: formData.estimated_days_max ? parseInt(formData.estimated_days_max) : null,
      };

      let result;
      if (editingItem) {
        result = await updateShippingZone(editingItem.id, data);
      } else {
        result = await createShippingZone(data);
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      handleCloseModal();
      loadData();
    });
  };

  const handleDeleteShippingZone = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shipping zone?")) return;
    startTransition(async () => {
      const result = await deleteShippingZone(id);
      if (result.error) setError(result.error);
      else loadData();
    });
  };

  const handleToggleShippingZone = async (id: string) => {
    startTransition(async () => {
      const result = await toggleShippingZoneActive(id);
      if (result.error) setError(result.error);
      else loadData();
    });
  };

  // Schedule handlers
  const handleSaveSchedule = async (formData: any) => {
    startTransition(async () => {
      const data = {
        ...formData,
        cutoff_hours_before: parseInt(formData.cutoff_hours_before) || 24,
        recurrence_rule:
          formData.schedule_type === "recurring" && formData.frequency
            ? {
                frequency: formData.frequency,
                day_of_week: formData.day_of_week ? parseInt(formData.day_of_week) : undefined,
              }
            : null,
      };
      delete data.frequency;
      delete data.day_of_week;

      let result;
      if (editingItem) {
        result = await updateSchedule(editingItem.id, data);
      } else {
        result = await createSchedule(data);
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      handleCloseModal();
      loadData();
    });
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    startTransition(async () => {
      const result = await deleteSchedule(id);
      if (result.error) setError(result.error);
      else loadData();
    });
  };

  const handleToggleSchedule = async (id: string) => {
    startTransition(async () => {
      const result = await toggleScheduleActive(id);
      if (result.error) setError(result.error);
      else loadData();
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-500)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">Fulfillment</h1>
        <p className="text-[var(--color-muted)]">
          Manage pickup locations, delivery zones, shipping zones, and schedules
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-[var(--color-error-light)] border border-[var(--color-error)] text-[var(--color-error)] px-4 py-3 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--color-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-[var(--color-primary-500)] text-[var(--color-primary-500)]"
                : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-charcoal)]"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Locations Tab */}
      {activeTab === "locations" && (
        <LocationsTab
          locations={locations}
          onAdd={() => handleOpenModal()}
          onEdit={handleOpenModal}
          onDelete={handleDeleteLocation}
          onToggle={handleToggleLocation}
          isPending={isPending}
        />
      )}

      {/* Delivery Zones Tab */}
      {activeTab === "delivery" && (
        <DeliveryZonesTab
          zones={deliveryZones}
          onAdd={() => handleOpenModal()}
          onEdit={handleOpenModal}
          onDelete={handleDeleteDeliveryZone}
          onToggle={handleToggleDeliveryZone}
          isPending={isPending}
        />
      )}

      {/* Shipping Zones Tab */}
      {activeTab === "shipping" && (
        <ShippingZonesTab
          zones={shippingZones}
          onAdd={() => handleOpenModal()}
          onEdit={handleOpenModal}
          onDelete={handleDeleteShippingZone}
          onToggle={handleToggleShippingZone}
          isPending={isPending}
        />
      )}

      {/* Schedules Tab */}
      {activeTab === "schedules" && (
        <SchedulesTab
          schedules={schedules}
          onAdd={() => handleOpenModal()}
          onEdit={handleOpenModal}
          onDelete={handleDeleteSchedule}
          onToggle={handleToggleSchedule}
          isPending={isPending}
        />
      )}

      {/* Modals */}
      {isModalOpen && activeTab === "locations" && (
        <LocationModal
          item={editingItem}
          onClose={handleCloseModal}
          onSave={handleSaveLocation}
          isPending={isPending}
          error={error}
        />
      )}

      {isModalOpen && activeTab === "delivery" && (
        <DeliveryZoneModal
          item={editingItem}
          onClose={handleCloseModal}
          onSave={handleSaveDeliveryZone}
          isPending={isPending}
          error={error}
        />
      )}

      {isModalOpen && activeTab === "shipping" && (
        <ShippingZoneModal
          item={editingItem}
          onClose={handleCloseModal}
          onSave={handleSaveShippingZone}
          isPending={isPending}
          error={error}
        />
      )}

      {isModalOpen && activeTab === "schedules" && (
        <ScheduleModal
          item={editingItem}
          onClose={handleCloseModal}
          onSave={handleSaveSchedule}
          isPending={isPending}
          error={error}
        />
      )}
    </div>
  );
}

// Tab Components
function LocationsTab({
  locations,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
  isPending,
}: {
  locations: FulfillmentLocation[];
  onAdd: () => void;
  onEdit: (item: FulfillmentLocation) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <Card variant="default">
      <CardHeader className="border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Pickup Locations ({locations.length})
          </CardTitle>
          <Button size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" />
            Add Location
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {locations.length > 0 ? (
          <div className="divide-y divide-[var(--color-border)]">
            {locations.map((location) => (
              <div
                key={location.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-[var(--color-slate-50)]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[var(--color-charcoal)]">{location.name}</p>
                    <Badge variant={location.type === "pickup" ? "default" : "info"} size="sm">
                      {location.type}
                    </Badge>
                    {location.is_coop && <Badge variant="accent" size="sm">Co-Op</Badge>}
                    {!location.is_active && <Badge variant="outline" size="sm">Inactive</Badge>}
                  </div>
                  {location.city && location.state && (
                    <p className="text-sm text-[var(--color-muted)]">
                      {location.city}, {location.state} {location.postal_code}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onToggle(location.id)} disabled={isPending}>
                    {location.is_active ? (
                      <ToggleRight className="w-5 h-5 text-[var(--color-success)]" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-[var(--color-muted)]" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(location)} disabled={isPending}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(location.id)}
                    disabled={isPending}
                    className="text-[var(--color-error)] hover:text-[var(--color-error)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <MapPin className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4" />
            <p className="text-[var(--color-muted)]">No pickup locations yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DeliveryZonesTab({
  zones,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
  isPending,
}: {
  zones: DeliveryZone[];
  onAdd: () => void;
  onEdit: (item: DeliveryZone) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <Card variant="default">
      <CardHeader className="border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Delivery Zones ({zones.length})
          </CardTitle>
          <Button size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" />
            Add Zone
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {zones.length > 0 ? (
          <div className="divide-y divide-[var(--color-border)]">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-[var(--color-slate-50)]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[var(--color-charcoal)]">{zone.name}</p>
                    {!zone.is_active && <Badge variant="outline" size="sm">Inactive</Badge>}
                  </div>
                  <p className="text-sm text-[var(--color-muted)]">
                    {zone.zip_codes.length} zip codes · Fee: {formatCurrency(zone.delivery_fee)}
                    {zone.free_delivery_threshold && (
                      <span> · Free over {formatCurrency(zone.free_delivery_threshold)}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onToggle(zone.id)} disabled={isPending}>
                    {zone.is_active ? (
                      <ToggleRight className="w-5 h-5 text-[var(--color-success)]" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-[var(--color-muted)]" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(zone)} disabled={isPending}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(zone.id)}
                    disabled={isPending}
                    className="text-[var(--color-error)] hover:text-[var(--color-error)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <Truck className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4" />
            <p className="text-[var(--color-muted)]">No delivery zones yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ShippingZonesTab({
  zones,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
  isPending,
}: {
  zones: ShippingZone[];
  onAdd: () => void;
  onEdit: (item: ShippingZone) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <Card variant="default">
      <CardHeader className="border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Shipping Zones ({zones.length})
          </CardTitle>
          <Button size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" />
            Add Zone
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {zones.length > 0 ? (
          <div className="divide-y divide-[var(--color-border)]">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-[var(--color-slate-50)]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[var(--color-charcoal)]">{zone.name}</p>
                    <Badge variant="info" size="sm">{zone.carrier.toUpperCase()}</Badge>
                    {!zone.is_active && <Badge variant="outline" size="sm">Inactive</Badge>}
                  </div>
                  <p className="text-sm text-[var(--color-muted)]">
                    {zone.states.length} states · Base: {formatCurrency(zone.base_rate)}
                    {zone.per_lb_rate > 0 && <span> + {formatCurrency(zone.per_lb_rate)}/lb</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onToggle(zone.id)} disabled={isPending}>
                    {zone.is_active ? (
                      <ToggleRight className="w-5 h-5 text-[var(--color-success)]" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-[var(--color-muted)]" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(zone)} disabled={isPending}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(zone.id)}
                    disabled={isPending}
                    className="text-[var(--color-error)] hover:text-[var(--color-error)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <Package className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4" />
            <p className="text-[var(--color-muted)]">No shipping zones yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SchedulesTab({
  schedules,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
  isPending,
}: {
  schedules: Schedule[];
  onAdd: () => void;
  onEdit: (item: Schedule) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <Card variant="default">
      <CardHeader className="border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedules ({schedules.length})
          </CardTitle>
          <Button size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" />
            Add Schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {schedules.length > 0 ? (
          <div className="divide-y divide-[var(--color-border)]">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-[var(--color-slate-50)]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[var(--color-charcoal)]">{schedule.name}</p>
                    <Badge variant={schedule.schedule_type === "recurring" ? "default" : "info"} size="sm">
                      {schedule.schedule_type}
                    </Badge>
                    {!schedule.is_active && <Badge variant="outline" size="sm">Inactive</Badge>}
                  </div>
                  <p className="text-sm text-[var(--color-muted)]">
                    {schedule.recurrence_rule ? (
                      <>
                        {schedule.recurrence_rule.frequency}
                        {schedule.recurrence_rule.day_of_week !== undefined && (
                          <span> on {daysOfWeek[schedule.recurrence_rule.day_of_week]}</span>
                        )}
                      </>
                    ) : (
                      "One-time dates"
                    )}
                    {" · "}Cutoff: {schedule.cutoff_hours_before}h before
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onToggle(schedule.id)} disabled={isPending}>
                    {schedule.is_active ? (
                      <ToggleRight className="w-5 h-5 text-[var(--color-success)]" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-[var(--color-muted)]" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(schedule)} disabled={isPending}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(schedule.id)}
                    disabled={isPending}
                    className="text-[var(--color-error)] hover:text-[var(--color-error)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <Calendar className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4" />
            <p className="text-[var(--color-muted)]">No schedules yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Modal Components
function LocationModal({
  item,
  onClose,
  onSave,
  isPending,
  error,
}: {
  item: FulfillmentLocation | null;
  onClose: () => void;
  onSave: (data: any) => void;
  isPending: boolean;
  error: string | null;
}) {
  const [formData, setFormData] = useState({
    name: item?.name || "",
    slug: item?.slug || "",
    type: item?.type || "pickup",
    description: item?.description || "",
    address_line1: item?.address_line1 || "",
    city: item?.city || "",
    state: item?.state || "",
    postal_code: item?.postal_code || "",
    is_active: item?.is_active ?? true,
    is_coop: item?.is_coop ?? false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-[var(--color-charcoal)] mb-6">
          {item ? "Edit Location" : "New Pickup Location"}
        </h2>

        {error && (
          <div className="bg-[var(--color-error-light)] border border-[var(--color-error)] text-[var(--color-error)] px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Location Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Farm Pickup"
            required
          />

          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg"
            >
              <option value="pickup">Pickup</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>

          <Input
            label="Address"
            value={formData.address_line1}
            onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
            placeholder="Street address"
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
            <Input
              label="Zip"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg"
              rows={3}
              placeholder="Pickup instructions, hours, etc."
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 rounded"
              />
              <span className="font-medium">Active</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_coop}
                onChange={(e) => setFormData({ ...formData, is_coop: e.target.checked })}
                className="w-5 h-5 rounded"
              />
              <div>
                <span className="font-medium">Co-Op Location</span>
                <p className="text-xs text-[var(--color-muted)]">
                  Mark this as a co-op pickup location (not the farm)
                </p>
              </div>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isPending}>
              {item ? "Save Changes" : "Create Location"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeliveryZoneModal({
  item,
  onClose,
  onSave,
  isPending,
  error,
}: {
  item: DeliveryZone | null;
  onClose: () => void;
  onSave: (data: any) => void;
  isPending: boolean;
  error: string | null;
}) {
  const [formData, setFormData] = useState({
    name: item?.name || "",
    slug: item?.slug || "",
    zip_codes_text: item?.zip_codes?.join(", ") || "",
    delivery_fee: item?.delivery_fee?.toString() || "0",
    min_order_amount: item?.min_order_amount?.toString() || "",
    free_delivery_threshold: item?.free_delivery_threshold?.toString() || "",
    is_active: item?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-[var(--color-charcoal)] mb-6">
          {item ? "Edit Delivery Zone" : "New Delivery Zone"}
        </h2>

        {error && (
          <div className="bg-[var(--color-error-light)] border border-[var(--color-error)] text-[var(--color-error)] px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Zone Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Lancaster County"
            required
          />

          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
              Zip Codes (comma or line separated)
            </label>
            <textarea
              value={formData.zip_codes_text}
              onChange={(e) => setFormData({ ...formData, zip_codes_text: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg"
              rows={4}
              placeholder="17501, 17502, 17503..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Delivery Fee"
              type="number"
              step="0.01"
              min="0"
              value={formData.delivery_fee}
              onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
            />
            <Input
              label="Minimum Order"
              type="number"
              step="0.01"
              min="0"
              value={formData.min_order_amount}
              onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
              placeholder="Optional"
            />
          </div>

          <Input
            label="Free Delivery Threshold"
            type="number"
            step="0.01"
            min="0"
            value={formData.free_delivery_threshold}
            onChange={(e) => setFormData({ ...formData, free_delivery_threshold: e.target.value })}
            placeholder="Orders over this amount get free delivery"
          />

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 rounded"
            />
            <span className="font-medium">Active</span>
          </label>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isPending}>
              {item ? "Save Changes" : "Create Zone"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ShippingZoneModal({
  item,
  onClose,
  onSave,
  isPending,
  error,
}: {
  item: ShippingZone | null;
  onClose: () => void;
  onSave: (data: any) => void;
  isPending: boolean;
  error: string | null;
}) {
  const [formData, setFormData] = useState({
    name: item?.name || "",
    slug: item?.slug || "",
    states: item?.states || [],
    base_rate: item?.base_rate?.toString() || "0",
    per_lb_rate: item?.per_lb_rate?.toString() || "0",
    carrier: item?.carrier || "ups",
    is_active: item?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleState = (code: string) => {
    setFormData((prev) => ({
      ...prev,
      states: prev.states.includes(code)
        ? prev.states.filter((s) => s !== code)
        : [...prev.states, code],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-[var(--color-charcoal)] mb-6">
          {item ? "Edit Shipping Zone" : "New Shipping Zone"}
        </h2>

        {error && (
          <div className="bg-[var(--color-error-light)] border border-[var(--color-error)] text-[var(--color-error)] px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Zone Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., East Coast"
            required
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Base Rate"
              type="number"
              step="0.01"
              min="0"
              value={formData.base_rate}
              onChange={(e) => setFormData({ ...formData, base_rate: e.target.value })}
              required
            />
            <Input
              label="Per Lb Rate"
              type="number"
              step="0.01"
              min="0"
              value={formData.per_lb_rate}
              onChange={(e) => setFormData({ ...formData, per_lb_rate: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">Carrier</label>
              <select
                value={formData.carrier}
                onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg"
              >
                <option value="ups">UPS</option>
                <option value="usps">USPS</option>
                <option value="fedex">FedEx</option>
                <option value="local">Local Carrier</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
              States ({formData.states.length} selected)
            </label>
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-[var(--color-border)] rounded-lg p-3">
              {US_STATES.map((state) => (
                <label key={state.code} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.states.includes(state.code)}
                    onChange={() => toggleState(state.code)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">{state.code}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 rounded"
            />
            <span className="font-medium">Active</span>
          </label>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isPending}>
              {item ? "Save Changes" : "Create Zone"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ScheduleModal({
  item,
  onClose,
  onSave,
  isPending,
  error,
}: {
  item: Schedule | null;
  onClose: () => void;
  onSave: (data: any) => void;
  isPending: boolean;
  error: string | null;
}) {
  const [formData, setFormData] = useState({
    name: item?.name || "",
    description: item?.description || "",
    schedule_type: item?.schedule_type || "recurring",
    frequency: item?.recurrence_rule?.frequency || "weekly",
    day_of_week: item?.recurrence_rule?.day_of_week?.toString() || "2",
    cutoff_hours_before: item?.cutoff_hours_before?.toString() || "24",
    is_active: item?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-[var(--color-charcoal)] mb-6">
          {item ? "Edit Schedule" : "New Schedule"}
        </h2>

        {error && (
          <div className="bg-[var(--color-error-light)] border border-[var(--color-error)] text-[var(--color-error)] px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Schedule Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Tuesday Deliveries"
            required
          />

          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">Schedule Type</label>
            <select
              value={formData.schedule_type}
              onChange={(e) => setFormData({ ...formData, schedule_type: e.target.value as any })}
              className="w-full px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg"
            >
              <option value="recurring">Recurring</option>
              <option value="one_time">One-Time</option>
            </select>
          </div>

          {formData.schedule_type === "recurring" && (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 Weeks</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">Day of Week</label>
                <select
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg"
                >
                  {daysOfWeek.map((day, idx) => (
                    <option key={idx} value={idx}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <Input
            label="Cutoff Hours Before"
            type="number"
            min="0"
            value={formData.cutoff_hours_before}
            onChange={(e) => setFormData({ ...formData, cutoff_hours_before: e.target.value })}
            helperText="Hours before delivery to stop accepting orders"
          />

          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg"
              rows={2}
              placeholder="Optional description"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 rounded"
            />
            <span className="font-medium">Active</span>
          </label>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isPending}>
              {item ? "Save Changes" : "Create Schedule"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
