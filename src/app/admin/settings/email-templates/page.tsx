import { getEmailTemplates } from "@/lib/actions/email-templates";
import Link from "next/link";
import { Plus, Mail } from "lucide-react";
import { EmailTemplateActions } from "./EmailTemplateActions";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  is_active: boolean;
  updated_at: string;
}

export default async function EmailTemplatesPage() {
  const { data: templates, error } = await getEmailTemplates();

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
        Error loading email templates: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[var(--color-muted)]">
            Customize email notifications sent to customers
          </p>
        </div>
        <Link
          href="/admin/settings/email-templates/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-500)] text-white rounded-lg hover:bg-[var(--color-primary-600)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Template
        </Link>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">Available Variables</h3>
            <p className="text-sm text-blue-800 mt-1">
              Use these variables in your templates: <code className="bg-blue-100 px-1 rounded">{"{{customer_name}}"}</code>,
              <code className="bg-blue-100 px-1 rounded ml-1">{"{{order_number}}"}</code>,
              <code className="bg-blue-100 px-1 rounded ml-1">{"{{tracking_number}}"}</code>,
              <code className="bg-blue-100 px-1 rounded ml-1">{"{{tracking_url}}"}</code>,
              <code className="bg-blue-100 px-1 rounded ml-1">{"{{carrier}}"}</code>
            </p>
          </div>
        </div>
      </div>

      {!templates || templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-12 text-center">
          <Mail className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4" />
          <h3 className="font-semibold text-[var(--color-charcoal)] text-lg mb-2">
            No custom templates yet
          </h3>
          <p className="text-[var(--color-muted)] mb-6">
            Create custom email templates to override the default notification emails
          </p>
          <Link
            href="/admin/settings/email-templates/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-500)] text-white rounded-lg hover:bg-[var(--color-primary-600)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Template
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--color-slate-50)] border-b border-[var(--color-border)]">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-[var(--color-charcoal)]">
                  Template Name
                </th>
                <th className="text-left p-4 text-sm font-semibold text-[var(--color-charcoal)]">
                  Subject
                </th>
                <th className="text-left p-4 text-sm font-semibold text-[var(--color-charcoal)]">
                  Status
                </th>
                <th className="text-left p-4 text-sm font-semibold text-[var(--color-charcoal)]">
                  Updated
                </th>
                <th className="text-right p-4 text-sm font-semibold text-[var(--color-charcoal)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {templates.map((template: EmailTemplate) => (
                <tr key={template.id} className="hover:bg-[var(--color-slate-50)] transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-[var(--color-charcoal)]">
                      {template.name}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-[var(--color-muted)] truncate max-w-md">
                      {template.subject}
                    </div>
                  </td>
                  <td className="p-4">
                    {template.is_active ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-[var(--color-muted)]">
                    {new Date(template.updated_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <EmailTemplateActions templateId={template.id} templateName={template.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
