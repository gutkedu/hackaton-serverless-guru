"use client";

import { useAuth } from "@/contexts/auth-context";
import ProtectedRoute from "@/components/protected-route";
import { useRouter } from "next/navigation";
import { useTopicsToken } from "@/hooks/use-topics-token";
import MainChat from "@/components/main-chat";
import Link from "next/link";
import { userService, UserInfo } from "@/lib/user-service";
import { useState, useEffect, useCallback } from "react";

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Just initialize the hook to trigger the auto-fetching mechanism
  useTopicsToken();

  const fetchUserInfo = useCallback(async () => {
    if (!user?.idToken) return;

    setIsLoading(true);
    try {
      const userInfo = await userService.getCurrentUser(user.idToken);
      setCurrentUserInfo(userInfo);
    } catch (err) {
      console.error("Failed to fetch user info:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

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

              {/* User Information Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  User Information
                </h3>

                {isLoading ? (
                  <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-4 py-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ) : currentUserInfo ? (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="text-gray-500">Username:</span>
                      <span className="ml-2 font-medium">
                        {currentUserInfo.username}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2">{currentUserInfo.email}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500">Lobby Status:</span>
                      {currentUserInfo.currentLobbyId ? (
                        <span className="ml-2 text-green-600 font-medium">
                          In a lobby
                        </span>
                      ) : (
                        <span className="ml-2 text-gray-700">
                          Not in a lobby
                        </span>
                      )}
                    </div>
                    {currentUserInfo.currentLobbyId && (
                      <div className="mt-2">
                        <Link
                          href={`/dashboard/lobbies/${currentUserInfo.currentLobbyId}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          Go to Current Lobby
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Unable to load user information
                  </div>
                )}
              </div>

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
