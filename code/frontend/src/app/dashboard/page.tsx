"use client";

import { useAuth } from "@/contexts/auth-context";
import ProtectedRoute from "@/components/protected-route";
import { useRouter } from "next/navigation";
import { useTopicsToken } from "@/hooks/use-topics-token";
import MainChat from "@/components/main-chat";
import Link from "next/link";

export default function DashboardPage() {
  const { signOut } = useAuth();
  const router = useRouter();

  // Just initialize the hook to trigger the auto-fetching mechanism
  useTopicsToken();

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
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard/lobbies"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Game Lobbies
                </Link>
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

              {/* Game Lobbies Card */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6 shadow-sm">
                <h3 className="text-lg font-medium text-blue-800 mb-2">
                  Game Lobbies
                </h3>
                <p className="text-blue-700 mb-4">
                  Join existing game lobbies or create your own to play with
                  friends!
                </p>
                <a
                  href="/dashboard/lobbies"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  View Lobbies
                </a>
              </div>

              {/* Main Chat Component */}
              <MainChat />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
