import { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { checkMembership } from "@/lib/actions/membership";
import { CartContent } from "./CartContent";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your shopping cart before checkout.",
};

async function CartData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const membershipResult = user
    ? await checkMembership(user.id)
    : { isMember: false, error: null };

  return <CartContent isMember={membershipResult.isMember} />;
}

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-500)]" />
          </div>
        </div>
      }
    >
      <CartData />
    </Suspense>
  );
}
