"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "../layout";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, error, clearError } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);

    try {
      await signIn({ email, password });
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center ${isDarkMode 
      ? 'bg-gradient-to-b from-gray-900 to-gray-800' 
      : 'bg-gradient-to-b from-blue-50 to-white'} p-4 transition-colors duration-300`}>
      <div className={`w-full max-w-md rounded-xl ${isDarkMode 
        ? 'bg-gray-800 shadow-2xl shadow-black/20' 
        : 'bg-white shadow-xl'} p-8 transition-colors duration-300`}>
        <h1 className={`mb-6 text-center text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Welcome Back
        </h1>

        {error && (
          <div className={`mb-4 rounded-lg ${isDarkMode 
            ? 'bg-red-900/20 text-red-200' 
            : 'bg-red-50 text-red-700'} p-4 transition-colors duration-300`}>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} transition-colors duration-300`}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`mt-1 block w-full rounded-lg px-3 py-2 ${isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} 
                border shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-300`}
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} transition-colors duration-300`}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`mt-1 block w-full rounded-lg px-3 py-2 ${isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} 
                border shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-300`}
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                href="/forgot-password"
                className={`${isDarkMode 
                  ? 'text-blue-400 hover:text-blue-300' 
                  : 'text-blue-600 hover:text-blue-500'} transition-colors duration-300`}
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-lg px-4 py-2 text-white shadow-lg transition-all duration-300 transform hover:scale-105 
                ${isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/25' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-600/25'} 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                ${isDarkMode ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'} 
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </form>

        <p className={`mt-6 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} transition-colors duration-300`}>
          Don't have an account?{" "}
          <Link 
            href="/signup" 
            className={`${isDarkMode 
              ? 'text-blue-400 hover:text-blue-300' 
              : 'text-blue-600 hover:text-blue-500'} transition-colors duration-300`}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
