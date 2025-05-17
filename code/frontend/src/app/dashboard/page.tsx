"use client";

import { useAuth } from "@/contexts/auth-context";
import ProtectedRoute from "@/components/protected-route";
import { useRouter } from "next/navigation";
import { useTopicsToken } from "@/hooks/use-topics-token";
import { useEffect } from "react";
import MainChat from "@/components/main-chat";

export default function DashboardPage() {
  const { signOut } = useAuth();
  const router = useRouter();

  // Use the hook to ensure tokens are fetched and stored in localStorage
  const { getToken } = useTopicsToken();

  // Prefetch tokens on component mount
  useEffect(() => {
    const prefetchTokens = async () => {
      try {
        // This will store the tokens in localStorage via the hook
        await getToken("lobby");
        await getToken("main-chat");
      } catch (error) {
        console.error("Error prefetching tokens:", error);
      }
    };

    prefetchTokens();
  }, [getToken]);

  const handleSignOut = () => {
    signOut();
    router.push("/login");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Dashboard
                </h1>
              </div>
              <div className="flex items-center">
                <button
                  onClick={handleSignOut}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white p-6 shadow sm:rounded-lg">
              <h2 className="mb-4 text-lg font-medium text-gray-900">
                Welcome to your Dashboard
              </h2>
              <p className="text-gray-600 mb-6">
                You are successfully authenticated!
              </p>

              {/* Main Chat Component */}
              <MainChat />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
