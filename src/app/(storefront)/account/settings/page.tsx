import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./SettingsForm";

export const metadata = {
  title: "Settings | Amos Miller Farm",
  description: "Manage your account settings",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/account/settings");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone")
    .eq("id", user.id)
    .single();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-slate-900">
          Account Settings
        </h1>
        <p className="text-slate-500 mt-1">
          Manage your profile and account preferences
        </p>
      </div>

      <SettingsForm
        initialName={profile?.full_name || ""}
        initialEmail={profile?.email || user.email || ""}
        initialPhone={profile?.phone || ""}
      />
    </div>
  );
}
