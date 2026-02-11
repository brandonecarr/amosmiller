"use client";

import { useState } from "react";
import { Code } from "lucide-react";

interface VariableInserterProps {
  onInsert: (variable: string) => void;
}

const variables = [
  { value: "{{customer_name}}", label: "Customer Name" },
  { value: "{{order_number}}", label: "Order Number" },
  { value: "{{tracking_number}}", label: "Tracking Number" },
  { value: "{{tracking_url}}", label: "Tracking URL" },
  { value: "{{carrier}}", label: "Carrier" },
];

export function VariableInserter({ onInsert }: VariableInserterProps) {
  const [showMenu, setShowMenu] = useState(false);

  function handleInsert(variable: string) {
    onInsert(variable);
    setShowMenu(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)] rounded transition-colors"
      >
        <Code className="w-3 h-3" />
        Insert Variable
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-8 z-20 w-56 bg-white rounded-lg shadow-lg border border-[var(--color-border)] py-1">
            {variables.map((variable) => (
              <button
                key={variable.value}
                type="button"
                onClick={() => handleInsert(variable.value)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-slate-50)] transition-colors"
              >
                <div className="font-medium text-[var(--color-charcoal)]">
                  {variable.label}
                </div>
                <code className="text-xs text-[var(--color-muted)]">
                  {variable.value}
                </code>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
