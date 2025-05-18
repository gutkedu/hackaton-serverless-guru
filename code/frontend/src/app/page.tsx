"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { useTheme } from "./layout";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-500'}`}></div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${isDarkMode 
      ? 'bg-gradient-to-b from-gray-900 to-gray-800' 
      : 'bg-gradient-to-b from-blue-50 to-white'} p-4 transition-colors duration-300`}>
      <div className={`text-center max-w-2xl px-4 sm:px-6 lg:px-8`}>
        <h1 className={`text-5xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
          Welcome to TypeRacer
        </h1>
        <p className={`text-xl mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-300`}>
          Challenge your typing skills in real-time races with friends!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className={`rounded-lg px-8 py-3 text-white shadow-lg transition-all duration-300 transform hover:scale-105 ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/25' 
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-600/25'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isDarkMode ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'
            }`}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className={`rounded-lg px-8 py-3 shadow-lg transition-all duration-300 transform hover:scale-105 ${
              isDarkMode 
                ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isDarkMode ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'
            }`}
          >
            Create Account
          </Link>
        </div>
        <div className={`mt-12 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Ready to test your typing speed?</p>
          <p className="mt-2">Join thousands of players and compete in real-time typing races!</p>
        </div>
      </div>
    </div>
  );
}
