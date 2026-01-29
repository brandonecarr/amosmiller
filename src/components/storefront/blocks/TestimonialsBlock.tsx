import { Quote } from "lucide-react";
import type { TestimonialsBlock as TestimonialsBlockType } from "@/types/cms";

interface TestimonialsBlockProps {
  block: TestimonialsBlockType;
}

export function TestimonialsBlock({ block }: TestimonialsBlockProps) {
  const { title, items } = block.data;

  if (!items || items.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto px-4">
      {title && (
        <h2 className="text-2xl md:text-3xl font-bold font-heading text-slate-900 mb-8 text-center">
          {title}
        </h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <Quote className="w-8 h-8 text-orange-400 opacity-30 mb-3" />
            <p className="text-slate-600 leading-relaxed mb-4 italic">
              &ldquo;{item.quote}&rdquo;
            </p>
            <div>
              <p className="font-semibold text-slate-900">
                {item.name}
              </p>
              {item.role && (
                <p className="text-sm text-slate-500">
                  {item.role}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
