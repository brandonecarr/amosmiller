"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEmailTemplate, updateEmailTemplate } from "@/lib/actions/email-templates";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { VariableInserter } from "./VariableInserter";

interface EmailTemplateFormProps {
  template?: {
    id: string;
    name: string;
    subject: string;
    body: string;
    is_active: boolean;
  };
}

export function EmailTemplateForm({ template }: EmailTemplateFormProps) {
  const router = useRouter();
  const [name, setName] = useState(template?.name || "");
  const [subject, setSubject] = useState(template?.subject || "");
  const [body, setBody] = useState(template?.body || "");
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    const formData = { name, subject, body, is_active: isActive };

    const result = template
      ? await updateEmailTemplate(template.id, formData)
      : await createEmailTemplate(formData);

    if (result.error) {
      setError(result.error);
      setIsSaving(false);
    } else {
      router.push("/admin/settings/email-templates");
      router.refresh();
    }
  }

  function insertVariable(variable: string, targetField: "subject" | "body") {
    if (targetField === "subject") {
      setSubject((prev) => prev + variable);
    } else {
      setBody((prev) => prev + variable);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/settings/email-templates"
          className="flex items-center gap-2 text-[var(--color-muted)] hover:text-[var(--color-charcoal)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Templates
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="out_for_delivery"
                className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                required
              />
              <p className="text-xs text-[var(--color-muted)] mt-1">
                Must match a notification event type (e.g., out_for_delivery, delivered, exception)
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[var(--color-charcoal)]">
                  Email Subject
                </label>
                <VariableInserter onInsert={(v) => insertVariable(v, "subject")} />
              </div>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Your order is out for delivery!"
                className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[var(--color-charcoal)]">
                  Email Body (HTML)
                </label>
                <VariableInserter onInsert={(v) => insertVariable(v, "body")} />
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={16}
                placeholder="<html>&#10;<body>&#10;  <h1>Your order is on the way!</h1>&#10;  <p>Hi {{customer_name}},</p>&#10;  <p>Good news! Your order #{{order_number}} is out for delivery.</p>&#10;</body>&#10;</html>"
                className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] font-mono text-sm"
                required
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
            <h3 className="font-semibold text-[var(--color-charcoal)] mb-4">Status</h3>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)]"
              />
              <span className="text-sm text-[var(--color-charcoal)]">
                Active
              </span>
            </label>
            <p className="text-xs text-[var(--color-muted)] mt-2">
              Only active templates will be used for notifications
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">
              Available Variables
            </h4>
            <ul className="space-y-1 text-xs text-blue-800">
              <li><code className="bg-blue-100 px-1 rounded">{"{{customer_name}}"}</code></li>
              <li><code className="bg-blue-100 px-1 rounded">{"{{order_number}}"}</code></li>
              <li><code className="bg-blue-100 px-1 rounded">{"{{tracking_number}}"}</code></li>
              <li><code className="bg-blue-100 px-1 rounded">{"{{tracking_url}}"}</code></li>
              <li><code className="bg-blue-100 px-1 rounded">{"{{carrier}}"}</code></li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary-500)] text-white rounded-lg hover:bg-[var(--color-primary-600)] transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : template ? "Update Template" : "Create Template"}
            </button>

            <Link
              href="/admin/settings/email-templates"
              className="w-full text-center px-4 py-2 border border-[var(--color-border)] text-[var(--color-charcoal)] rounded-lg hover:bg-[var(--color-slate-50)] transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
