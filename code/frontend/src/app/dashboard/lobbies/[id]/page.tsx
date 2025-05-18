"use client";

import { useAuth } from "@/contexts/auth-context";
import {
  lobbyService,
  LobbyDetails,
  StartGameRequest,
} from "@/lib/lobby-service";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/protected-route";
import { GameEvent, GameEventType } from "@/lib/types/game-events";
import { MomentoService } from "@/lib/momento-service";
import { useTopicsToken } from "@/hooks/use-topics-token";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useTheme } from "@/app/layout";

export default function LobbyDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [lobby, setLobby] = useState<LobbyDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    "easy" | "medium" | "hard"
  >("medium");
  const { getToken } = useTopicsToken();

  // State for the confirmation modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // Function to fetch lobby details
  const fetchLobbyDetails = useCallback(async () => {
    if (!user?.idToken || !id) return;

    setError(null);

    try {
      const data = await lobbyService.getLobbyDetails(
        id as string,
        user.idToken
      );

      if (data) {
        setLobby(data);
      } else {
        console.error("Received empty lobby details");
        setError("Failed to load lobby details. Please try again.");
      }
    } catch (err) {
      console.error("Failed to fetch lobby details:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch lobby details. Please try again.";
      setError(errorMessage);
      // Keep existing lobby data if available
    } finally {
      setIsLoading(false);
    }
  }, [user, id]);

  // Add event handling function
  const handleGameEvent = useCallback((event: GameEvent) => {
    console.log('Received game event:', event);

    switch (event.type) {
      case GameEventType.GAME_STARTED:
        if (event.content && event.gameId && event.lobbyId) {
          // Redirect to game page with lobbyId and initialContent
          router.push(`/dashboard/game/${event.gameId}?lobbyId=${event.lobbyId}&initialContent=${encodeURIComponent(event.content)}`);
        } else {
          console.error('GAME_STARTED event missing critical data:', event);
          setError("Failed to start game: event data incomplete.");
        }
        break;
      case GameEventType.PLAYER_JOINED:
        // Refresh lobby details to show new player
        fetchLobbyDetails();
        break;
      case GameEventType.PLAYER_LEFT:
        // Refresh lobby details to remove player
        fetchLobbyDetails();
        break;
      case GameEventType.GAME_ENDED:
        // Handle game ended event
        router.push("/dashboard/lobbies");
        break;
      case GameEventType.GAME_STATE_UPDATED:
        // Update game state in UI
        fetchLobbyDetails();
        break;
      case GameEventType.PLAYER_ACTION:
        // Handle player actions if needed
        break;
    }
  }, [router, fetchLobbyDetails]);

  // Subscribe to game events
  useEffect(() => {
    if (!user?.idToken || !id) return;

    const momentoService = MomentoService.getInstance();
    let isSubscribed = true;

    const setupSubscription = async () => {
      try {
        // Get the token for the lobby topic
        const tokenResponse = await getToken("lobby");
        if (!tokenResponse) {
          throw new Error("Failed to get token for lobby");
        }

        // Initialize Momento service with the token and cache name
        await momentoService.initialize({
          token: tokenResponse.token,
          endpoint: tokenResponse.endpoint,
          cacheName: tokenResponse.cacheName
        });
        
        // Subscribe to the lobby events
        await momentoService.subscribeToLobby(
          id as string,
          (event) => {
            if (isSubscribed) {
              handleGameEvent(event);
            }
          },
          (error) => {
            if (isSubscribed) {
              console.error('Subscription error:', error);
              setError('Failed to connect to game events. Please refresh the page.');
            }
          }
        );
      } catch (err) {
        console.error('Failed to subscribe to game events:', err);
        if (isSubscribed) {
          setError('Failed to connect to game events. Please refresh the page.');
        }
      }
    };

    setupSubscription();

    // Cleanup subscription on unmount
    return () => {
      isSubscribed = false;
      momentoService.unsubscribeFromLobby(id as string).catch(console.error);
    };
  }, [user, id, handleGameEvent, getToken]);

  // Fetch lobby details on mount and when the ID changes
  useEffect(() => {
    if (!id) return;
    fetchLobbyDetails();

    // Set up an interval to poll for lobby updates
    const intervalId = setInterval(fetchLobbyDetails, 5000);

    return () => clearInterval(intervalId);
  }, [id, fetchLobbyDetails]);

  // Handle starting the game
  const handleStartGame = async () => {
    if (!user?.idToken || !lobby || !id) return;

    // Confirm before starting the game
    // if (!window.confirm(`Start game with difficulty: ${selectedDifficulty}?`)) {
    //   return;
    // }
    setModalTitle("Start Game?");
    setModalMessage(`Are you sure you want to start the game with difficulty: ${selectedDifficulty}?`);
    setConfirmAction(() => () => handleStartGameInternal());
    setIsModalOpen(true);
  };

  const handleStartGameInternal = async () => {
    if (!user?.idToken || !lobby || !id) return;
    setIsStartingGame(true);
    setError(null);

    try {
      const request: StartGameRequest = {
        lobbyId: id as string,
        difficulty: selectedDifficulty,
      };

      await lobbyService.startGame(request, user.idToken);
      // The GAME_STARTED event will trigger navigation, so fetchLobbyDetails might not be strictly needed here
      // await fetchLobbyDetails(); 
    } catch (err) {
      console.error("Failed to start game:", err);
      setError("Failed to start game. Please try again.");
    } finally {
      setIsStartingGame(false);
    }
  };

  // Handle leaving the lobby
  const handleLeaveLobby = async () => {
    if (!user?.idToken) return;

    // Confirm before leaving
    // if (!window.confirm("Are you sure you want to leave this lobby?")) {
    //   return;
    // }
    setModalTitle("Leave Lobby?");
    setModalMessage("Are you sure you want to leave this lobby? This action cannot be undone.");
    setConfirmAction(() => () => handleLeaveLobbyInternal());
    setIsModalOpen(true);
  };

  const handleLeaveLobbyInternal = async () => {
    if (!user?.idToken) return;
    try {
      await lobbyService.leaveLobby(user.idToken);
      router.push("/dashboard/lobbies");
    } catch (err) {
      console.error("Failed to leave lobby:", err);
      setError("Failed to leave lobby. Please try again.");
    }
  };

  // Check if the current user is the owner of the lobby
  const isOwner = lobby?.hostId === user?.sub;
  
  return (
    <ProtectedRoute>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} pb-10 transition-all duration-300`}>
        {/* Header with improved styling */}
        <div className={`${isDarkMode ? 'bg-gray-800/80 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm'} shadow-lg sticky top-0 z-10 transition-all duration-300`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className={`animate-spin rounded-full h-5 w-5 border-2 border-t-transparent ${isDarkMode ? 'border-white' : 'border-gray-900'} mr-2`}></div>
                      Loading...
                    </div>
                  ) : (
                    lobby?.name || "Lobby Details"
                  )}
                </h1>
                {!isLoading && lobby && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    lobby.status === "WAITING" || lobby.status === "OPEN"
                      ? isDarkMode ? 'bg-green-900/20 text-green-300' : 'bg-green-100 text-green-800'
                      : isDarkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-100 text-blue-800'
                  } transition-colors duration-300`}>
                    {lobby.status}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard/lobbies"
                  className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                    isDarkMode 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  } transition-all duration-300`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l5.293 5.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Back to Lobbies
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
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

          {isLoading ? (
            <div className={`${isDarkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg rounded-xl p-8 transition-all duration-300`}>
              <div className="flex flex-col items-center justify-center">
                <div className={`animate-spin rounded-full h-12 w-12 border-4 border-t-transparent ${isDarkMode ? 'border-blue-400' : 'border-blue-500'} mb-4`}></div>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-lg font-medium transition-colors duration-300`}>Loading lobby details...</p>
              </div>
            </div>
          ) : lobby ? (
            <div className={`${isDarkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg rounded-xl overflow-hidden transition-all duration-300`}>
              {/* Lobby Info */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} transition-all duration-300`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                      <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Players</h3>
                    </div>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {Array.isArray(lobby.players) ? lobby.players.length : 0} / {lobby.maxPlayers}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} transition-all duration-300`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Created</h3>
                    </div>
                    <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {new Date(lobby.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} transition-all duration-300`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                      </svg>
                      <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Host</h3>
                    </div>
                    <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {isOwner ? `${user?.username} (You)` : lobby.ownerUsername}
                    </p>
                  </div>
                </div>
              </div>

              {/* Players List */}
              <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} transition-colors duration-300`}>
                <div className="p-6">
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4 transition-colors duration-300`}>
                    Players
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.isArray(lobby.players) && lobby.players.length > 0 ? (
                      lobby.players.map((player) => (
                        <div
                          key={player.id}
                          className={`p-4 rounded-lg ${
                            player.id === user?.username
                              ? isDarkMode ? 'bg-blue-900/20 border border-blue-800/50' : 'bg-blue-50 border border-blue-200'
                              : isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                          } transition-all duration-300`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                              }`}>
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                                  {player.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className={`font-medium ${
                                  player.id === user?.username
                                    ? isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                    : isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {player.username}
                                  {player.id === user?.username && " (You)"}
                                </p>
                                {lobby.status === "PLAYING" && (
                                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    WPM: {player.wpm || 0}
                                  </p>
                                )}
                              </div>
                            </div>
                            {player.id === lobby.hostId && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                isDarkMode ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                Host
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={`col-span-full p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-lg font-medium">No players yet</p>
                        <p className="text-sm mt-1">Waiting for players to join...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Game Controls */}
              {(lobby.status === "WAITING" || lobby.status === "OPEN") && (
                <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-6 transition-colors duration-300`}>
                  {isOwner ? (
                    <div className="space-y-4">
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                        Game Settings
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2 transition-colors duration-300`}>
                            Difficulty
                          </label>
                          <select
                            value={selectedDifficulty}
                            onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                            className={`block w-full px-4 py-2.5 text-base border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                              isDarkMode
                                ? 'bg-gray-700/50 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            } transition-all duration-300`}
                          >
                            <option value="easy">Easy - Shorter text, simple words</option>
                            <option value="medium">Medium - Moderate length, mixed vocabulary</option>
                            <option value="hard">Hard - Long text, complex words</option>
                          </select>
                        </div>

                        <div className="flex items-end">
                          <button
                            onClick={handleStartGame}
                            disabled={isStartingGame}
                            className={`w-full inline-flex justify-center items-center px-6 py-2.5 text-sm font-semibold rounded-lg shadow-sm ${
                              isDarkMode
                                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95`}
                          >
                            {isStartingGame ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                                Starting Game...
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                                Start Game
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`text-center py-8 ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-lg`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Waiting for host
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        The lobby host will start the game when ready...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Leave Lobby Button */}
              <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-6 transition-colors duration-300`}>
                <div className="flex justify-end">
                  <button
                    onClick={handleLeaveLobby}
                    className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg shadow-sm ${
                      isDarkMode
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    } focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 active:scale-95`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                    Leave Lobby
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className={`${isDarkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg rounded-xl p-8 text-center transition-all duration-300`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Lobby not found</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
                This lobby may have been closed or doesn't exist.
              </p>
              <Link
                href="/dashboard/lobbies"
                className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg shadow-sm ${
                  isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 active:scale-95`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l5.293 5.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Lobbies
              </Link>
            </div>
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => {
          if (confirmAction) {
            confirmAction();
          }
          setIsModalOpen(false);
        }}
        title={modalTitle}
        message={modalMessage}
      />
    </ProtectedRoute>
  );
}
