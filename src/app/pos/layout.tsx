import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/pos");
  }

  // Check if user has staff or admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "staff" && profile.role !== "admin")) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[var(--color-slate-100)]">
      {children}
    </div>
  );
}
