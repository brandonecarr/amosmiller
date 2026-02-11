import { getNotificationSettings } from "@/lib/actions/notification-settings";
import { NotificationToggle } from "./NotificationToggle";
import {
  Truck,
  CheckCircle,
  AlertTriangle,
  Package,
  XCircle
} from "lucide-react";

interface NotificationSetting {
  id: string;
  event_type: string;
  is_enabled: boolean;
}

const eventTypeConfig = [
  {
    type: "in_transit",
    label: "In Transit",
    description: "Package has been scanned by carrier (can generate many notifications)",
    icon: Package,
    iconColor: "text-slate-600",
    bgColor: "bg-slate-100",
  },
  {
    type: "out_for_delivery",
    label: "Out for Delivery",
    description: "Package is out for delivery today",
    icon: Truck,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    type: "delivered",
    label: "Delivered",
    description: "Package has been successfully delivered",
    icon: CheckCircle,
    iconColor: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    type: "exception",
    label: "Delivery Exception",
    description: "Issue with delivery (weather delay, address issue, etc.)",
    icon: AlertTriangle,
    iconColor: "text-red-600",
    bgColor: "bg-red-100",
  },
  {
    type: "failed_attempt",
    label: "Failed Delivery Attempt",
    description: "Carrier attempted delivery but customer was unavailable",
    icon: XCircle,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-100",
  },
];

export default async function NotificationsPage() {
  const { data: settings, error } = await getNotificationSettings();

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
        Error loading notification settings: {error}
      </div>
    );
  }

  const settingsMap = new Map<string, NotificationSetting>(
    settings?.map((s: NotificationSetting) => [s.event_type, s]) || []
  );

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <Package className="w-5 h-5 text-blue-600 mt-0.5" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">About Notification Settings</h3>
            <p className="text-sm text-blue-800 mt-1">
              Control which shipment events trigger automatic email notifications to customers.
              Toggle notifications on or off for each event type below.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {eventTypeConfig.map((config) => {
          const setting = settingsMap.get(config.type);
          const Icon = config.icon;

          return (
            <div
              key={config.type}
              className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${config.iconColor}`} />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-[var(--color-charcoal)] text-lg">
                        {config.label}
                      </h3>
                      <p className="text-sm text-[var(--color-muted)] mt-1">
                        {config.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-4">
                    <NotificationToggle
                      settingId={setting?.id}
                      eventType={config.type}
                      initialEnabled={setting?.is_enabled ?? false}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
