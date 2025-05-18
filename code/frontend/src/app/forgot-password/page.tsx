"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const { forgotPassword, resetPassword, error, clearError } = useAuth();
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);

    try {
      await forgotPassword(email);
      setResetRequested(true);
    } catch (error) {
      console.error("Forgot password error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);

    try {
      await resetPassword({
        email,
        confirmationCode,
        newPassword,
      });
      router.push("/login");
    } catch (error) {
      console.error("Reset password error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-surface-50 to-surface-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-surface-50 p-8 shadow-lg transition-colors duration-300">
        <h1 className="mb-6 text-center text-2xl font-bold text-foreground">
          {resetRequested ? "Reset your password" : "Forgot your password?"}
        </h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/10 p-4">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {!resetRequested ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="mb-4 text-sm text-surface-600 dark:text-surface-400">
              Enter your email address and we'll send you a code to reset your
              password.
            </p>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-surface-300 bg-surface-50 px-3 py-2 text-foreground placeholder-surface-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 transition-colors duration-300"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-primary-600 px-4 py-2 text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-300"
              >
                {isSubmitting ? "Submitting..." : "Send reset code"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="mb-4 text-sm text-surface-600 dark:text-surface-400">
              Enter the verification code sent to your email and choose a new
              password.
            </p>

            <div>
              <label
                htmlFor="confirmationCode"
                className="block text-sm font-medium text-foreground"
              >
                Verification Code
              </label>
              <input
                id="confirmationCode"
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-surface-300 bg-surface-50 px-3 py-2 text-foreground placeholder-surface-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 transition-colors duration-300"
                placeholder="123456"
              />
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-foreground"
              >
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-surface-300 bg-surface-50 px-3 py-2 text-foreground placeholder-surface-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 transition-colors duration-300"
                placeholder="••••••••"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-primary-600 px-4 py-2 text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-300"
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-surface-600 dark:text-surface-400">
          Remember your password?{" "}
          <Link href="/login" className="text-primary-600 hover:text-primary-500 transition-colors duration-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
