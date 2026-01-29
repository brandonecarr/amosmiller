"use client";

import { useState } from "react";
import { User, Mail, Phone, Lock, Loader2, Check } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { updateProfile, changePassword } from "@/lib/actions/profile";

interface SettingsFormProps {
  initialName: string;
  initialEmail: string;
  initialPhone: string;
}

export function SettingsForm({ initialName, initialEmail, initialPhone }: SettingsFormProps) {
  // Profile form
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(false);

    const result = await updateProfile({ fullName: name, phone });
    if (result.error) {
      setProfileError(result.error);
    } else {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    }
    setProfileSaving(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      setPasswordSaving(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      setPasswordSaving(false);
      return;
    }

    const result = await changePassword(newPassword);
    if (result.error) {
      setPasswordError(result.error);
    } else {
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    }
    setPasswordSaving(false);
  };

  return (
    <div className="space-y-8">
      {/* Profile Information */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-[var(--color-charcoal)] flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </h2>
        </div>
        <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
              Full Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
              Email
            </label>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-slate-50)] border border-[var(--color-border)] rounded-lg text-[var(--color-muted)]">
              <Mail className="w-4 h-4" />
              {initialEmail}
            </div>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Contact support to change your email address
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
              Phone Number
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
            />
          </div>

          {profileError && (
            <p className="text-sm text-[var(--color-error)]">{profileError}</p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={profileSaving}>
              {profileSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : profileSuccess ? (
                <Check className="w-4 h-4 mr-2" />
              ) : null}
              {profileSuccess ? "Saved" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-[var(--color-charcoal)] flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Change Password
          </h2>
        </div>
        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
              New Password
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
              Confirm New Password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </div>

          {passwordError && (
            <p className="text-sm text-[var(--color-error)]">{passwordError}</p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={passwordSaving}>
              {passwordSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : passwordSuccess ? (
                <Check className="w-4 h-4 mr-2" />
              ) : null}
              {passwordSuccess ? "Password Updated" : "Update Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
