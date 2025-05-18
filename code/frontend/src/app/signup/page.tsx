"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const { signUp, confirmSignUp, error, clearError } = useAuth();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);

    try {
      await signUp({ email, password, username });
      setSuccess(true);
    } catch (error) {
      console.error("Signup error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);

    try {
      await confirmSignUp({ email, confirmationCode: verificationCode });
      router.push("/login");
    } catch (error) {
      console.error("Confirmation error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-surface-50 to-surface-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-surface-50 p-8 shadow-lg transition-colors duration-300">
        <h1 className="mb-6 text-center text-2xl font-bold text-foreground">
          {success ? "Verify your email" : "Create an account"}
        </h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/10 p-4">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {!success ? (
          <form onSubmit={handleSignup} className="space-y-4">
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
              <label
                htmlFor="username"
                className="block text-sm font-medium text-foreground"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-surface-300 bg-surface-50 px-3 py-2 text-foreground placeholder-surface-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 transition-colors duration-300"
                placeholder="username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                {isSubmitting ? "Signing up..." : "Sign Up"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleConfirmSignup} className="space-y-4">
            <p className="mb-4 text-sm text-surface-600 dark:text-surface-400">
              We've sent a verification code to your email. Please enter it
              below to complete your registration.
            </p>
            <div>
              <label
                htmlFor="verificationCode"
                className="block text-sm font-medium text-foreground"
              >
                Verification Code
              </label>
              <input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-surface-300 bg-surface-50 px-3 py-2 text-foreground placeholder-surface-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 transition-colors duration-300"
                placeholder="123456"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-primary-600 px-4 py-2 text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-300"
              >
                {isSubmitting ? "Verifying..." : "Verify Email"}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-surface-600 dark:text-surface-400">
          Already have an account?{" "}
          <Link href="/login" className="text-primary-600 hover:text-primary-500 transition-colors duration-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
