"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, Send } from "lucide-react";
import { deleteEmailTemplate, sendTestEmail } from "@/lib/actions/email-templates";
import Link from "next/link";

interface EmailTemplateActionsProps {
  templateId: string;
  templateName: string;
}

export function EmailTemplateActions({ templateId, templateName }: EmailTemplateActionsProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${templateName}"?`)) return;

    const { success, error } = await deleteEmailTemplate(templateId);

    if (success) {
      router.refresh();
    } else {
      alert(`Failed to delete template: ${error}`);
    }
  }

  async function handleSendTest() {
    if (!testEmail || !testEmail.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }

    setIsSending(true);
    const { success, error } = await sendTestEmail(templateId, testEmail);
    setIsSending(false);

    if (success) {
      alert("Test email sent successfully!");
      setShowTestDialog(false);
      setTestEmail("");
    } else {
      alert(`Failed to send test email: ${error}`);
    }
  }

  return (
    <div className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 hover:bg-[var(--color-slate-100)] rounded-lg transition-colors"
      >
        <MoreHorizontal className="w-4 h-4 text-[var(--color-muted)]" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-10 z-20 w-48 bg-white rounded-lg shadow-lg border border-[var(--color-border)] py-1">
            <Link
              href={`/admin/settings/email-templates/${templateId}`}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--color-slate-50)] transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Link>

            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                setShowTestDialog(true);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--color-slate-50)] transition-colors"
            >
              <Send className="w-4 h-4" />
              Send Test Email
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}

      {showTestDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--color-charcoal)] mb-4">
              Send Test Email
            </h3>
            <p className="text-sm text-[var(--color-muted)] mb-4">
              Enter an email address to send a test notification
            </p>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowTestDialog(false);
                  setTestEmail("");
                }}
                className="px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-charcoal)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendTest}
                disabled={isSending}
                className="px-4 py-2 text-sm bg-[var(--color-primary-500)] text-white rounded-lg hover:bg-[var(--color-primary-600)] transition-colors disabled:opacity-50"
              >
                {isSending ? "Sending..." : "Send Test"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
