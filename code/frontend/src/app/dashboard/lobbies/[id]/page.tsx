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

export default function LobbyDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [lobby, setLobby] = useState<LobbyDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    "easy" | "medium" | "hard"
  >("medium");

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
    if (!window.confirm(`Start game with difficulty: ${selectedDifficulty}?`)) {
      return;
    }

    setIsStartingGame(true);
    setError(null);

    try {
      const request: StartGameRequest = {
        lobbyId: id as string,
        difficulty: selectedDifficulty,
      };

      await lobbyService.startGame(request, user.idToken);
      // Redirect to game page or refresh the lobby state
      await fetchLobbyDetails();
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
    if (!window.confirm("Are you sure you want to leave this lobby?")) {
      return;
    }

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
  
  // Add debug logging
  useEffect(() => {
    if (lobby && user) {
      console.log('Lobby owner check:', {
        hostId: lobby.hostId,
        userId: user.sub,
        username: user.username,
        isOwner: lobby.hostId === user.sub
      });
    }
  }, [lobby, user]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-10">
        <div className="bg-white shadow mb-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between items-center">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  {isLoading
                    ? "Loading Lobby..."
                    : lobby?.name || "Lobby Details"}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={fetchLobbyDetails}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {isLoading ? "Refreshing..." : "Refresh"}
                </button>
                <Link
                  href="/dashboard/lobbies"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Back to Lobbies
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-3"></div>
                <p className="text-gray-500">Loading lobby details...</p>
              </div>
            </div>
          ) : lobby ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              {/* Lobby Info */}
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Lobby Information
                </h3>
                <div className="mt-1 max-w-2xl flex items-center">
                  <span className="text-sm text-gray-500 mr-2">Status:</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      lobby.status === "OPEN" || lobby.status === "WAITING"
                        ? "bg-green-100 text-green-800"
                        : lobby.status === "IN_GAME" ||
                          lobby.status === "PLAYING"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {lobby.status}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      Players
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {Array.isArray(lobby.players) ? lobby.players.length : 0} / {lobby.maxPlayers}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      Created At
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(lobby.createdAt).toLocaleString()}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Owner</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {isOwner ? `${user?.username} (You)` : lobby.ownerUsername}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Players List */}
              <div className="border-t border-gray-200">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Players
                  </h3>
                </div>
                <ul className="divide-y divide-gray-200">
                  {Array.isArray(lobby.players) && lobby.players.length > 0 ? (
                    lobby.players.map((player) => (
                      <li key={player.id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {player.username}
                            {player.id === user?.username && " (You)"}
                          </p>
                          {lobby.status === "PLAYING" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Score: {player.score || 0}
                            </span>
                          )}
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                      No players in this lobby yet.
                    </li>
                  )}
                </ul>
              </div>

              {/* Game Controls */}
              {(lobby.status === "WAITING" || lobby.status === "OPEN") && (
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  {isOwner ? (
                    <div className="space-y-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Game Settings
                      </h3>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Difficulty
                        </label>
                        <select
                          value={selectedDifficulty}
                          onChange={(e) =>
                            setSelectedDifficulty(e.target.value as any)
                          }
                          className="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={handleStartGame}
                          disabled={isStartingGame}
                          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
                        >
                          {isStartingGame ? "Starting Game..." : "Start Game"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">
                        Waiting for the lobby owner to start the game...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Leave Lobby Button */}
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <div className="flex justify-end">
                  <button
                    onClick={handleLeaveLobby}
                    className="inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Leave Lobby
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <p className="text-center text-gray-500">Lobby not found.</p>
              <div className="mt-4 text-center">
                <Link
                  href="/dashboard/lobbies"
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Back to Lobbies
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
