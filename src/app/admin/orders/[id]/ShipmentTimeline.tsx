import { getShipmentEvents } from "@/lib/actions/shipment-events";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  MapPin 
} from "lucide-react";

interface ShipmentTimelineProps {
  orderId: string;
}

interface ShipmentEvent {
  id: string;
  event_type: string;
  description: string | null;
  occurred_at: string;
  carrier: string | null;
  location_city: string | null;
  location_state: string | null;
}

export async function ShipmentTimeline({ orderId }: ShipmentTimelineProps) {
  const { data: events, error } = await getShipmentEvents(orderId);

  if (error || !events || events.length === 0) {
    return null;
  }

  // Get icon and color based on event type
  const getEventStyle = (eventType: string) => {
    switch (eventType) {
      case 'delivered':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-100',
          border: 'border-green-300',
        };
      case 'out_for_delivery':
        return {
          icon: Truck,
          color: 'text-blue-600',
          bg: 'bg-blue-100',
          border: 'border-blue-300',
        };
      case 'exception':
      case 'failed_attempt':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bg: 'bg-red-100',
          border: 'border-red-300',
        };
      default:
        return {
          icon: Package,
          color: 'text-slate-600',
          bg: 'bg-slate-100',
          border: 'border-slate-300',
        };
    }
  };

  const formatEventType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border)]">
        <h2 className="text-sm font-semibold text-[var(--color-charcoal)] flex items-center gap-2">
          <Package className="w-4 h-4" />
          Shipment Tracking History
        </h2>
      </div>

      <div className="p-6">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-[var(--color-border)]" />

          {/* Events */}
          <div className="space-y-6">
            {events.map((event: ShipmentEvent) => {
              const style = getEventStyle(event.event_type);
              const Icon = style.icon;

              return (
                <div key={event.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full ${style.bg} ${style.border} border-2 flex items-center justify-center z-10`}
                  >
                    <Icon className={`w-5 h-5 ${style.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className={`font-semibold ${style.color}`}>
                        {formatEventType(event.event_type)}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-[var(--color-muted)]">
                        <Clock className="w-3 h-3" />
                        {new Date(event.occurred_at).toLocaleString()}
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-sm text-[var(--color-charcoal)] mb-2">
                        {event.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-[var(--color-muted)]">
                      {event.carrier && (
                        <span className="font-medium uppercase">
                          {event.carrier}
                        </span>
                      )}
                      {(event.location_city || event.location_state) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location_city && event.location_state
                            ? `${event.location_city}, ${event.location_state}`
                            : event.location_city || event.location_state}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
