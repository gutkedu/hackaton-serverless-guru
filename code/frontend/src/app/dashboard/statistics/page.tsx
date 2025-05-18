"use client";

import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { GameStatistics, gameStatisticsService } from "@/lib/game-statistics-service";
import ProtectedRoute from "@/components/protected-route";
import Link from "next/link";
import { useTheme } from "@/app/layout";

export default function StatisticsPage() {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState<GameStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const fetchStatistics = async () => {
      if (!user?.idToken) return;

      try {
        setIsLoading(true);
        const data = await gameStatisticsService.getGameStatistics(user.idToken);
        setStatistics(data);
      } catch (err) {
        setError("Failed to load game statistics");
        console.error("Error fetching statistics:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, [user?.idToken]);

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp)).toLocaleDateString();
  };

  return (
    <ProtectedRoute>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} pb-10 transition-all duration-300`}>
        {/* Header */}
        <div className={`${isDarkMode ? 'bg-gray-800/80 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm'} shadow-lg sticky top-0 z-10 transition-all duration-300`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                  Global Rankings
                </h1>
              </div>
              <Link
                href="/dashboard"
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                } transition-all duration-300`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {error ? (
            <div className={`rounded-lg ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'} p-4 transition-colors duration-300`}>
              <p className={`text-sm ${isDarkMode ? 'text-red-200' : 'text-red-800'}`}>{error}</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-8">
              <div className={`animate-pulse h-48 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
              <div className={`animate-pulse h-96 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
            </div>
          ) : statistics && (
            <div className="space-y-8">
              {/* Game Stats Section */}
              <section>
                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} transition-colors duration-300`}>
                  <div className="mb-6">
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Game Statistics
                    </h2>
                    <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Overview of all games played on the platform
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'} transition-colors duration-300`}>
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-blue-600'} mb-2`}>Total Games Started</div>
                      <div className="flex items-baseline">
                        <span className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {statistics.totalGamesStarted}
                        </span>
                        <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>games</span>
                      </div>
                    </div>
                    
                    <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-green-50'} transition-colors duration-300`}>
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-green-600'} mb-2`}>Games Completed</div>
                      <div className="flex items-baseline">
                        <span className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {statistics.totalGamesFinished}
                        </span>
                        <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>games</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Leaderboard Section */}
              <section>
                <div className={`rounded-2xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'} transition-colors duration-300`}>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Speed Champions
                    </h2>
                    <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Top players ranked by their best typing speed
                    </p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors duration-300`}>
                        <tr>
                          <th className={`px-6 py-4 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Rank</th>
                          <th className={`px-6 py-4 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Username</th>
                          <th className={`px-6 py-4 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Best WPM</th>
                          <th className={`px-6 py-4 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Games Played</th>
                          <th className={`px-6 py-4 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Last Game</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        {statistics.topPlayersScoreboard.map((player, index) => (
                          <tr key={player.username} 
                              className={`${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-50'} 
                                        transition-colors duration-200`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {index === 0 && (
                                  <div className="flex items-center">
                                    <span className="text-2xl mr-2">🏆</span>
                                    <span className="font-semibold text-yellow-500">1st</span>
                                  </div>
                                )}
                                {index === 1 && (
                                  <div className="flex items-center">
                                    <span className="text-2xl mr-2">🥈</span>
                                    <span className="font-semibold text-gray-400">2nd</span>
                                  </div>
                                )}
                                {index === 2 && (
                                  <div className="flex items-center">
                                    <span className="text-2xl mr-2">🥉</span>
                                    <span className="font-semibold text-amber-600">3rd</span>
                                  </div>
                                )}
                                {index > 2 && (
                                  <span className="font-medium ml-2">{index + 1}th</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="font-medium">{player.username}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium
                                            ${isDarkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                                {player.bestWpm} WPM
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {player.gamesPlayedInvolvingScoreboard} games
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {formatDate(player.lastGameTimestamp)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
} 