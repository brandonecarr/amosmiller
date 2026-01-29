import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserAddresses } from "@/lib/actions/addresses";
import { AddressBook } from "./AddressBook";

export const metadata = {
  title: "Address Book | Amos Miller Farm",
  description: "Manage your delivery addresses",
};

export default async function AddressesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/account/addresses");
  }

  const { data: addresses } = await getUserAddresses();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
          Address Book
        </h1>
        <p className="text-[var(--color-muted)] mt-1">
          Manage your saved addresses for faster checkout
        </p>
      </div>

      <AddressBook initialAddresses={addresses || []} />
    </div>
  );
}
