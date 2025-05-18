"use client";

import { useAuth } from "@/contexts/auth-context";
import ProtectedRoute from "@/components/protected-route";
import { useRouter } from "next/navigation";
import { useTopicsToken } from "@/hooks/use-topics-token";
import MainChat from "@/components/main-chat";
import Link from "next/link";
import { userService, UserInfo } from "@/lib/user-service";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../layout";

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { theme, setTheme } = useTheme();
  
  const isDarkMode = theme === "dark" || (theme === "system" && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

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

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ProtectedRoute>
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        {/* Navigation Bar */}
        <nav className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-lg transition-colors duration-300`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  TypeRacer Dashboard
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard/lobbies"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${isDarkMode 
                    ? 'text-blue-300 hover:text-blue-100 hover:bg-gray-700' 
                    : 'text-blue-600 hover:text-blue-800 hover:bg-gray-100'} transition-colors duration-300`}
                >
                  Game Lobbies
                </Link>
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-full ${isDarkMode 
                    ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'} transition-colors duration-300`}
                  aria-label="Toggle dark mode"
                >
                  {isDarkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={handleSignOut}
                  className={`rounded-md px-4 py-2 text-sm font-medium ${isDarkMode 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'} transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Information Card */}
            <div className={`col-span-1 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-xl shadow-md transition-colors duration-300 overflow-hidden`}>
              <div className={`px-6 py-5 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className="text-lg font-semibold">User Profile</h2>
              </div>
              <div className="px-6 py-5">
                {isLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-3/4`}></div>
                    <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/2`}></div>
                  </div>
                ) : currentUserInfo ? (
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Username</span>
                      <span className="font-medium text-lg">{currentUserInfo.username}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</span>
                      <span className="font-medium">{currentUserInfo.email}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Lobby Status</span>
                      {currentUserInfo.currentLobbyId ? (
                        <span className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                          In a lobby
                        </span>
                      ) : (
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                          Not in a lobby
                        </span>
                      )}
                    </div>
                    {currentUserInfo.currentLobbyId && (
                      <div className="mt-3">
                        <Link
                          href={`/dashboard/lobbies/${currentUserInfo.currentLobbyId}`}
                          className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm ${isDarkMode 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'} transition-colors duration-300`}
                        >
                          Go to Current Lobby
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Unable to load user information
                  </div>
                )}
              </div>
            </div>

            {/* Game Lobbies Card */}
            <div className={`col-span-1 rounded-xl shadow-md overflow-hidden transition-colors duration-300 ${isDarkMode 
              ? 'bg-blue-900 text-blue-100' 
              : 'bg-blue-50 text-blue-900'}`}>
              <div className={`px-6 py-5 ${isDarkMode ? 'border-b border-blue-800' : 'border-b border-blue-100'}`}>
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-blue-100' : 'text-blue-800'}`}>
                  Game Lobbies
                </h2>
              </div>
              <div className="px-6 py-5">
                <div className={`flex items-center mb-4 ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Join existing game lobbies or create your own to play with friends!
                </div>
                <Link
                  href="/dashboard/lobbies"
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${isDarkMode 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'} transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  View All Lobbies
                </Link>
              </div>
            </div>

            {/* Stats Card */}
            <div className={`col-span-1 rounded-xl shadow-md overflow-hidden transition-colors duration-300 ${isDarkMode 
              ? 'bg-gray-800 text-white' 
              : 'bg-white text-gray-900'}`}>
              <div className={`px-6 py-5 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className="text-lg font-semibold">Your Stats</h2>
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Games Played</div>
                    <div className="text-2xl font-bold mt-1">0</div>
                  </div>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Wins</div>
                    <div className="text-2xl font-bold mt-1">0</div>
                  </div>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg. WPM</div>
                    <div className="text-2xl font-bold mt-1">0</div>
                  </div>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Best WPM</div>
                    <div className="text-2xl font-bold mt-1">0</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Chat Section */}
          <div className={`mt-6 rounded-xl shadow-md overflow-hidden transition-colors duration-300 ${isDarkMode 
            ? 'bg-gray-800 text-white' 
            : 'bg-white text-gray-900'}`}>
            <div className={`px-6 py-5 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className="text-lg font-semibold">Global Chat</h2>
            </div>
            <div className="px-0 py-0">
              <MainChat />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
