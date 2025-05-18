/**
 * User service for handling user-related API calls
 */
import { api } from "./api";

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  currentLobbyId?: string;
  stats: {
    gamesPlayed: number;
    wins: number;
    bestWpm: number;
    winRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

class UserService {
  /**
   * Get current user information including lobby status and game statistics
   */
  async getCurrentUser(idToken: string): Promise<UserInfo> {
    return api<UserInfo>("/game/me", {
      method: "GET",
      token: `Bearer ${idToken}`,
    });
  }
}

export const userService = new UserService();
