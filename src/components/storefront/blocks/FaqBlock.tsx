"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FaqBlock as FaqBlockType } from "@/types/cms";

interface FaqBlockProps {
  block: FaqBlockType;
}

export function FaqBlock({ block }: FaqBlockProps) {
  const { title, items } = block.data;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!items || items.length === 0) return null;

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-3xl mx-auto px-4">
      {title && (
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-charcoal)] mb-8 text-center">
          {title}
        </h2>
      )}
      <div className="space-y-3">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="bg-white rounded-lg border border-[var(--color-border)] overflow-hidden hover:shadow-sm transition-shadow"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-medium text-[var(--color-charcoal)] pr-4">
                  {item.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-[var(--color-muted)] flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  isOpen ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="px-6 pb-4 text-[var(--color-muted)] leading-relaxed">
                  {item.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
