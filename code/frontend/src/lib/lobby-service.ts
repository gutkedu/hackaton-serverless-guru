/**
 * Lobby service for handling lobby-related API calls
 */
import { api } from "./api";

export interface Lobby {
  id: string;
  name: string;
  maxPlayers: number;
  currentPlayers: number;
  createdAt: string;
  status: string;
  hostId: string;
  ownerUsername?: string;
}

export interface LobbyDetails extends Lobby {
  players: {
    id: string;
    username: string;
    score?: number;
  }[];
}

export interface CreateLobbyRequest {
  name: string;
  maxPlayers: number;
}

export interface JoinLobbyRequest {
  lobbyId: string;
}

export interface StartGameRequest {
  lobbyId: string;
  difficulty: "easy" | "medium" | "hard";
}

class LobbyService {
  /**
   * Get a list of all available lobbies
   */
  async getLobbies(idToken: string): Promise<Lobby[]> {
    try {
      // The API returns { lobbies: Lobby[], nextToken?: string }
      const response = await api<{ lobbies: Lobby[]; nextToken?: string }>(
        "/game/lobbies",
        {
          method: "GET",
          token: `Bearer ${idToken}`,
        }
      );

      // Return just the lobbies array
      return response.lobbies || [];
    } catch (error) {
      console.error("Error fetching lobbies:", error);
      // If token expired, we'll let the auth context handle the refresh
      throw error;
    }
  }

  /**
   * Get details for a specific lobby
   */
  async getLobbyDetails(
    lobbyId: string,
    idToken: string
  ): Promise<LobbyDetails> {
    try {
      const response = await api<{
        lobby: Lobby;
        players: {
          id: string;
          username: string;
          score?: number;
        }[];
      }>(`/game/lobbies/${lobbyId}`, {
        method: "GET",
        token: `Bearer ${idToken}`,
      });

      // Combine the lobby and players data to form a LobbyDetails object
      return {
        ...response.lobby,
        players: response.players || [],
      };
    } catch (error) {
      console.error(`Error fetching details for lobby ${lobbyId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new lobby
   */
  async createLobby(
    request: CreateLobbyRequest,
    idToken: string
  ): Promise<Lobby> {
    console.log("Request body:", JSON.stringify(request));

    try {
      // Make sure we have a valid lobby name and max players
      if (!request.name || request.name.trim().length < 3) {
        throw new Error("Lobby name must be at least 3 characters");
      }

      if (
        !request.maxPlayers ||
        request.maxPlayers < 2 ||
        request.maxPlayers > 10
      ) {
        throw new Error("Max players must be between 2 and 10");
      }

      // Using explicit Bearer prefix as required by the backend
      const response = await api<{ lobby: Lobby }>("/game/lobbies/create", {
        method: "POST",
        body: request,
        token: `Bearer ${idToken}`,
      });

      console.log("Successfully created lobby response:", response);

      // Return just the lobby object from the response
      return response.lobby || (response as any);
    } catch (error) {
      console.error("Failed to create lobby:", error);
      throw error;
    }
  }

  /**
   * Join an existing lobby
   */
  async joinLobby(
    request: JoinLobbyRequest,
    idToken: string
  ): Promise<{ message: string }> {
    try {
      if (!request.lobbyId) {
        throw new Error("Lobby ID is required");
      }

      return await api<{ message: string }>("/game/lobbies/join", {
        method: "POST",
        body: request,
        token: `Bearer ${idToken}`,
      });
    } catch (error) {
      console.error(`Error joining lobby:`, error);
      throw error;
    }
  }

  /**
   * Start a game in a lobby
   */
  async startGame(
    request: StartGameRequest,
    idToken: string
  ): Promise<{ message: string }> {
    try {
      return await api<{ message: string }>("/game/lobbies/start", {
        method: "POST",
        body: request,
        token: `Bearer ${idToken}`,
      });
    } catch (error) {
      console.error("Error starting game:", error);
      throw error;
    }
  }

  /**
   * Leave the current lobby
   */
  async leaveLobby(idToken: string): Promise<{ message: string }> {
    try {
      return await api<{ message: string }>("/game/lobbies/leave", {
        method: "POST",
        body: {},
        token: `Bearer ${idToken}`,
      });
    } catch (error) {
      console.error("Error leaving lobby:", error);
      throw error;
    }
  }
}

export const lobbyService = new LobbyService();
