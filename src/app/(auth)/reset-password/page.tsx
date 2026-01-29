"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import { Mail, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/callback?type=recovery`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-[var(--color-success-light)] rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-[var(--color-success)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-charcoal)] mb-2">
          Check Your Email
        </h1>
        <p className="text-[var(--color-muted)] mb-6">
          If an account exists for <strong>{email}</strong>, you&apos;ll receive a
          password reset link shortly.
        </p>
        <Link href="/login">
          <Button variant="outline">Back to Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-[var(--color-muted)] hover:text-[var(--color-charcoal)] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sign In
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-charcoal)] mb-2">
          Reset Password
        </h1>
        <p className="text-[var(--color-muted)]">
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-[var(--color-error-light)] text-[var(--color-error)] rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-12"
            required
            autoComplete="email"
          />
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
          Send Reset Link
        </Button>
      </form>
    </div>
  );
}
