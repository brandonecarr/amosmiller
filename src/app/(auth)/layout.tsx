import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-cream-100)] flex flex-col">
      {/* Simple Header */}
      <header className="py-6">
        <div className="container mx-auto px-4">
          <Link href="/" className="text-2xl font-bold text-[var(--color-primary-500)]">
            Amos Miller Farm
          </Link>
        </div>
      </header>

      {/* Auth Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-6 text-center text-sm text-[var(--color-muted)]">
        <p>&copy; {new Date().getFullYear()} Amos Miller Farm. All rights reserved.</p>
      </footer>
    </div>
  );
}
