"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Loader2, CheckCircle, XCircle, Package } from "lucide-react";
import { Button } from "@/components/ui";
import { processAllDueSubscriptions } from "@/lib/actions/subscription-orders";

interface ProcessResult {
  subscriptionId: string;
  orderId?: string;
  orderNumber?: number;
  success: boolean;
  error?: string;
}

export default function ProcessSubscriptionsPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<ProcessResult[] | null>(null);
  const [stats, setStats] = useState<{ successCount: number; errorCount: number } | null>(null);

  const handleProcess = () => {
    startTransition(async () => {
      const result = await processAllDueSubscriptions();
      setResults(result.processed);
      setStats({
        successCount: result.successCount,
        errorCount: result.errorCount,
      });
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/subscriptions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
            Process Subscriptions
          </h1>
          <p className="text-[var(--color-muted)]">
            Generate orders for all subscriptions due today
          </p>
        </div>
      </div>

      {/* Process Button */}
      {!results && (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-[var(--color-primary-600)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-charcoal)] mb-2">
            Ready to Process
          </h2>
          <p className="text-[var(--color-muted)] mb-6 max-w-md mx-auto">
            This will create orders for all active subscriptions with a next order date of today or earlier.
          </p>
          <Button size="lg" onClick={handleProcess} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 mr-2" />
                Process Subscriptions
              </>
            )}
          </Button>
        </div>
      )}

      {/* Results */}
      {results && stats && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-xl border border-green-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-800">{stats.successCount}</p>
                  <p className="text-green-700">Orders Created</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-red-800">{stats.errorCount}</p>
                  <p className="text-red-700">Failed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h2 className="font-semibold text-[var(--color-charcoal)]">Results</h2>
              <Button variant="outline" onClick={() => router.push("/admin/orders")}>
                <Package className="w-4 h-4 mr-2" />
                View Orders
              </Button>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {results.length === 0 ? (
                <div className="p-6 text-center text-[var(--color-muted)]">
                  No subscriptions were due for processing
                </div>
              ) : (
                results.map((result) => (
                  <div
                    key={result.subscriptionId}
                    className="px-6 py-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-[var(--color-charcoal)]">
                          Subscription: {result.subscriptionId.slice(0, 8)}...
                        </p>
                        {result.success ? (
                          <p className="text-sm text-green-600">
                            Order #{result.orderNumber} created
                          </p>
                        ) : (
                          <p className="text-sm text-red-600">{result.error}</p>
                        )}
                      </div>
                    </div>
                    {result.success && result.orderId && (
                      <Link href={`/admin/orders/${result.orderId}`}>
                        <Button variant="ghost" size="sm">
                          View Order
                        </Button>
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setResults(null);
                setStats(null);
              }}
            >
              Process More
            </Button>
            <Link href="/admin/subscriptions">
              <Button variant="outline">Back to Subscriptions</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
