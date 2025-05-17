"use client";

import { useAuth } from "@/contexts/auth-context";
import { lobbyService, Lobby } from "@/lib/lobby-service";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/protected-route";

export default function LobbiesPage() {
  const { user } = useAuth();
  const router = useRouter();
  // Ensure lobbies is always initialized as an empty array
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newLobbyName, setNewLobbyName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);

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

  // Fetch lobbies when component mounts
  useEffect(() => {
    fetchLobbies();
  }, [fetchLobbies]);

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
      await fetchLobbies(); // Refresh lobby list
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
    if (!user?.idToken) return;

    try {
      await lobbyService.joinLobby({ lobbyId }, user.idToken);
      router.push(`/dashboard/lobbies/${lobbyId}`);
    } catch (err) {
      console.error("Failed to join lobby:", err);
      setError("Failed to join lobby. Please try again.");
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-10">
        <div className="bg-white shadow mb-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between items-center">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Game Lobbies
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Create Lobby Form */}
          <div className="bg-white p-6 shadow sm:rounded-lg mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Create New Lobby
            </h2>
            <form onSubmit={handleCreateLobby} className="space-y-4">
              <div>
                <label
                  htmlFor="lobbyName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Lobby Name
                </label>
                <input
                  id="lobbyName"
                  type="text"
                  value={newLobbyName}
                  onChange={(e) => setNewLobbyName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter lobby name"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="maxPlayers"
                  className="block text-sm font-medium text-gray-700"
                >
                  Max Players
                </label>
                <select
                  id="maxPlayers"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
                >
                  <option value="2">2</option>
                  <option value="4">4</option>
                  <option value="6">6</option>
                  <option value="8">8</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isCreatingLobby || !newLobbyName.trim()}
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
                >
                  {isCreatingLobby ? "Creating..." : "Create Lobby"}
                </button>
              </div>
            </form>
          </div>

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

          {/* Lobbies List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Available Lobbies
              </h2>{" "}
              <button
                onClick={fetchLobbies}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                    Loading...
                  </>
                ) : (
                  "Refresh"
                )}
              </button>
            </div>

            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                Loading lobbies...
              </div>
            ) : !lobbies || lobbies.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No lobbies available. Create a new one to get started!
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {Array.isArray(lobbies) &&
                  lobbies.map((lobby) => (
                    <li key={lobby.id}>
                      <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                        <div className="flex flex-col">
                          <h3 className="text-lg font-medium text-gray-900">
                            {lobby.name}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Players: {lobby.currentPlayers}/{lobby.maxPlayers}
                          </p>
                          <div className="mt-1 flex items-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                lobby.status === "OPEN" ||
                                lobby.status === "WAITING"
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
                        <div>
                          <button
                            onClick={() => handleJoinLobby(lobby.id)}
                            disabled={
                              (lobby.status !== "WAITING" &&
                                lobby.status !== "OPEN") ||
                              lobby.currentPlayers >= lobby.maxPlayers
                            }
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300"
                          >
                            Join
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
