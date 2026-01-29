import { NextResponse } from "next/server";
import { createTerminalConnectionToken } from "@/lib/stripe/terminal";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  // Verify user is authenticated and has staff/admin role
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "staff" && profile.role !== "admin")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  const result = await createTerminalConnectionToken();

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({ secret: result.secret });
}
