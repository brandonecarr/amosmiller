import { getEmailTemplate } from "@/lib/actions/email-templates";
import { notFound } from "next/navigation";
import { EmailTemplateForm } from "../EmailTemplateForm";

export default async function EditEmailTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: template, error } = await getEmailTemplate(id);

  if (error || !template) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-charcoal)]">
          Edit Email Template
        </h2>
        <p className="text-[var(--color-muted)] mt-1">
          Customize the email template for {template.name}
        </p>
      </div>

      <EmailTemplateForm template={template} />
    </div>
  );
}
