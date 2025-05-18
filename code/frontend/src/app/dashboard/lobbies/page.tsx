"use client";

import { useAuth } from "@/contexts/auth-context";
import { lobbyService, Lobby } from "@/lib/lobby-service";
import { userService, UserInfo } from "@/lib/user-service";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/protected-route";
import { useTheme } from "@/app/layout";

export default function LobbiesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  // Ensure lobbies is always initialized as an empty array
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newLobbyName, setNewLobbyName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo | null>(null);

  // Function to fetch lobbies
  const fetchLobbies = useCallback(async () => {
    if (!user?.idToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await lobbyService.getLobbies(user.idToken);

      // Ensure data is an array before setting it
      if (Array.isArray(data)) {
        setLobbies(data);
      } else {
        console.error("Unexpected response format:", data);
        setLobbies([]);
        setError("Received an invalid response format from the server.");
      }
    } catch (err) {
      console.error("Failed to fetch lobbies:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch lobbies. Please try again.";
      setError(errorMessage);
      // Set empty array to prevent null/undefined issues
      setLobbies([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Function to fetch user info
  const fetchUserInfo = useCallback(async () => {
    if (!user?.idToken) return;

    try {
      const userInfo = await userService.getCurrentUser(user.idToken);
      setCurrentUserInfo(userInfo);

      // If user is already in a lobby, redirect to that lobby
      if (userInfo.currentLobbyId) {
        router.push(`/dashboard/lobbies/${userInfo.currentLobbyId}`);
      }
    } catch (err) {
      console.error("Failed to fetch user info:", err);
    }
  }, [user, router]);

  // Fetch lobbies when component mounts
  useEffect(() => {
    fetchLobbies();
    fetchUserInfo();
  }, [fetchLobbies, fetchUserInfo]);

  // Handle creating a new lobby
  const handleCreateLobby = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.idToken || !newLobbyName.trim()) return;

    setIsCreatingLobby(true);
    setError(null);

    try {
      console.log(
        "Creating lobby with name:",
        newLobbyName.trim(),
        "and max players:",
        maxPlayers
      );

      if (newLobbyName.trim().length < 3) {
        throw new Error("Lobby name must be at least 3 characters");
      }

      const result = await lobbyService.createLobby(
        { name: newLobbyName.trim(), maxPlayers },
        user.idToken
      );

      console.log("Successfully created lobby:", result);
      setNewLobbyName("");
      
      // Redirect to the newly created lobby
      router.push(`/dashboard/lobbies/${result.id}`);
    } catch (err) {
      console.error("Failed to create lobby:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to create lobby. Please try again.";
      setError(errorMessage);
    } finally {
      setIsCreatingLobby(false);
    }
  };

  // Handle joining a lobby
  const handleJoinLobby = async (lobbyId: string) => {
    if (!user?.idToken) {
      setError("You must be logged in to join a lobby.");
      return;
    }

    try {
      const response = await lobbyService.joinLobby({ lobbyId }, user.idToken);
      
      // If we have a warning, show it but continue with the join
      if (response.warning) {
        console.warn("Warning while joining lobby:", response.warning);
        // Optionally show a warning toast or message to the user
      }
      
      // Continue with navigation regardless of warning
      router.push(`/dashboard/lobbies/${lobbyId}`);
    } catch (err) {
      console.error("Failed to join lobby:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Failed to join lobby. Please try again.";
      setError(errorMessage);
    }
  };

  return (
    <ProtectedRoute>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} pb-10 transition-all duration-300`}>
        {/* Header with improved styling */}
        <div className={`${isDarkMode ? 'bg-gray-800/80 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm'} shadow-lg sticky top-0 z-10 transition-all duration-300`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                  Game Lobbies
                </h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isDarkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-100 text-blue-800'
                } transition-colors duration-300`}>
                  {lobbies.length} Active
                </span>
              </div>
              <div className="flex items-center space-x-4">
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
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
          {/* Check if user is already in a lobby */}
          {currentUserInfo?.currentLobbyId && (
            <div className={`${
              isDarkMode 
                ? 'bg-yellow-900/20 border-yellow-600/50' 
                : 'bg-yellow-50 border-yellow-400'
            } border-l-4 p-4 mb-6 rounded-r-lg shadow-sm transition-all duration-300 animate-fadeIn`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className={`h-5 w-5 ${isDarkMode ? 'text-yellow-500' : 'text-yellow-400'}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className={`text-sm ${isDarkMode ? 'text-yellow-200' : 'text-yellow-700'} transition-colors duration-300`}>
                    You are already in a lobby. Redirecting to your current lobby...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Create Lobby Form with improved styling */}
          <div className={`${
            isDarkMode 
              ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' 
              : 'bg-white border border-gray-200'
          } p-6 shadow-lg sm:rounded-xl mb-6 transition-all duration-300`}>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4 transition-colors duration-300`}>
              Create New Lobby
            </h2>
            <form onSubmit={handleCreateLobby} className="space-y-4">
              <div>
                <label
                  htmlFor="lobbyName"
                  className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} transition-colors duration-300`}
                >
                  Lobby Name
                </label>
                <input
                  id="lobbyName"
                  type="text"
                  value={newLobbyName}
                  onChange={(e) => setNewLobbyName(e.target.value)}
                  className={`mt-1 block w-full rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm transition-all duration-300`}
                  placeholder="Enter a unique lobby name"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="maxPlayers"
                  className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} transition-colors duration-300`}
                >
                  Max Players
                </label>
                <select
                  id="maxPlayers"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className={`mt-1 block w-full rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700/50 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm transition-all duration-300`}
                >
                  <option value="2">2 Players</option>
                  <option value="4">4 Players</option>
                  <option value="6">6 Players</option>
                  <option value="8">8 Players</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={
                    isCreatingLobby ||
                    !newLobbyName.trim() ||
                    !!currentUserInfo?.currentLobbyId
                  }
                  className={`inline-flex justify-center items-center rounded-lg px-6 py-2.5 text-sm font-semibold shadow-sm ${
                    isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95`}
                >
                  {isCreatingLobby ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      Create Lobby
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`rounded-lg ${
              isDarkMode ? 'bg-red-900/20 border border-red-800/50' : 'bg-red-50 border border-red-200'
            } p-4 mb-6 animate-fadeIn transition-all duration-300`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-red-400'}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${isDarkMode ? 'text-red-200' : 'text-red-800'} transition-colors duration-300`}>
                    {error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Lobbies List with improved styling */}
          <div className={`${
            isDarkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white border border-gray-200'
          } shadow-lg sm:rounded-xl overflow-hidden transition-all duration-300`}>
            <div className={`flex justify-between items-center p-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} transition-colors duration-300`}>
              <div className="flex items-center space-x-3">
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                  Available Lobbies
                </h2>
                {!isLoading && lobbies.length > 0 && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isDarkMode ? 'bg-green-900/20 text-green-300' : 'bg-green-100 text-green-800'
                  } transition-colors duration-300`}>
                    {lobbies.length} Available
                  </span>
                )}
              </div>
              <button
                onClick={fetchLobbies}
                disabled={isLoading}
                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''} mr-1.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {isLoading ? (
              <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>
                <div className={`inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-500'} mb-4`}></div>
                <p>Loading lobbies...</p>
              </div>
            ) : !lobbies || lobbies.length === 0 ? (
              <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-lg font-medium mb-2">No lobbies available</p>
                <p className="text-sm">Create a new lobby to get started!</p>
              </div>
            ) : (
              <ul className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'} transition-colors duration-300`}>
                {Array.isArray(lobbies) &&
                  lobbies.map((lobby) => (
                    <li key={lobby.id} className={`hover:${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} transition-all duration-300`}>
                      <div className="px-6 py-4 flex items-center justify-between">
                        <div className="flex flex-col flex-grow">
                          <div className="flex items-center space-x-3">
                            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                              {lobby.name}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                lobby.status === "OPEN" ||
                                lobby.status === "WAITING"
                                  ? isDarkMode
                                    ? 'bg-green-900/20 text-green-300'
                                    : 'bg-green-100 text-green-800'
                                  : lobby.status === "IN_GAME" ||
                                    lobby.status === "PLAYING"
                                  ? isDarkMode
                                    ? 'bg-blue-900/20 text-blue-300'
                                    : 'bg-blue-100 text-blue-800'
                                  : isDarkMode
                                    ? 'bg-gray-700 text-gray-300'
                                    : 'bg-gray-100 text-gray-800'
                              } transition-colors duration-300`}
                            >
                              {lobby.status}
                            </span>
                          </div>
                          <div className="flex items-center mt-1 space-x-4">
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>
                              <span className={`inline-block w-2 h-2 rounded-full ${
                                lobby.currentPlayers < lobby.maxPlayers
                                  ? 'bg-green-400'
                                  : 'bg-red-400'
                              } mr-2`}></span>
                              {lobby.currentPlayers}/{lobby.maxPlayers} Players
                            </p>
                            <div className={`h-4 w-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>
                              Created {new Date(lobby.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div>
                          <button
                            onClick={() => handleJoinLobby(lobby.id)}
                            disabled={
                              (lobby.status !== "WAITING" &&
                                lobby.status !== "OPEN") ||
                              lobby.currentPlayers >= lobby.maxPlayers ||
                              !!currentUserInfo?.currentLobbyId
                            }
                            className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg shadow-sm ${
                              isDarkMode
                                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95`}
                          >
                            {currentUserInfo?.currentLobbyId ? (
                              "Already in Lobby"
                            ) : lobby.currentPlayers >= lobby.maxPlayers ? (
                              "Lobby Full"
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Join
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
