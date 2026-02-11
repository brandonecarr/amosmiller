"use client";

import Link from "next/link";
import { Printer } from "lucide-react";

interface PrintButtonProps {
  orderId: string;
}

export function PrintButton({ orderId }: PrintButtonProps) {
  return (
    <div className="no-print flex justify-between items-center mb-6 pb-6 border-b">
      <Link
        href={`/admin/orders/${orderId}`}
        className="text-[var(--color-primary-500)] hover:underline"
      >
        ← Back to Order
      </Link>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-500)] text-white rounded-lg hover:bg-[var(--color-primary-600)] transition-colors"
      >
        <Printer className="w-4 h-4" />
        Print Packing List
      </button>
    </div>
  );
}
