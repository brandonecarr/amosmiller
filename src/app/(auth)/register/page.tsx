"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import { Mail, Lock, Eye, EyeOff, User, Phone } from "lucide-react";
import { syncRegistrationToMailchimp } from "@/lib/actions/integrations";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Sign up user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          },
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.user) {
        // Create profile record
        // Note: In production, this would be handled by a database trigger
        // on auth.users insert. For now, we'll skip the manual insert
        // as the profiles table requires the auth.users foreign key.

        // Sync new customer to Mailchimp (fire-and-forget)
        syncRegistrationToMailchimp({
          email: formData.email,
          fullName: formData.fullName,
        });

        setSuccess(true);
      }
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
          We&apos;ve sent a confirmation link to <strong>{formData.email}</strong>.
          Please click the link to verify your account.
        </p>
        <Link href="/login">
          <Button variant="outline">Back to Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-charcoal)] mb-2">
          Create an Account
        </h1>
        <p className="text-[var(--color-muted)]">
          Join our farm family and start shopping
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-[var(--color-error-light)] text-[var(--color-error)] rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
          <Input
            type="text"
            name="fullName"
            placeholder="Full name"
            value={formData.fullName}
            onChange={handleChange}
            className="pl-12"
            required
            autoComplete="name"
          />
        </div>

        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
          <Input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            className="pl-12"
            required
            autoComplete="email"
          />
        </div>

        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
          <Input
            type="tel"
            name="phone"
            placeholder="Phone number (optional)"
            value={formData.phone}
            onChange={handleChange}
            className="pl-12"
            autoComplete="tel"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
          <Input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="pl-12 pr-12"
            required
            autoComplete="new-password"
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-charcoal)]"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
          <Input
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="pl-12"
            required
            autoComplete="new-password"
          />
        </div>

        <p className="text-xs text-[var(--color-muted)]">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="text-[var(--color-primary-500)] hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-[var(--color-primary-500)] hover:underline">
            Privacy Policy
          </Link>
        </p>

        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
          Create Account
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-[var(--color-muted)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[var(--color-primary-500)] font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
