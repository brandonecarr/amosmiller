import { EmailTemplateForm } from "../EmailTemplateForm";

export default function NewEmailTemplatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-charcoal)]">
          New Email Template
        </h2>
        <p className="text-[var(--color-muted)] mt-1">
          Create a custom email template for notifications
        </p>
      </div>

      <EmailTemplateForm />
    </div>
  );
}
