/**
 * User service for handling user-related API calls
 */
import { api } from "./api";

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  currentLobbyId?: string;
}

class UserService {
  /**
   * Get current user information including lobby status
   */
  async getCurrentUser(idToken: string): Promise<UserInfo> {
    return api<UserInfo>("/game/me", {
      method: "GET",
      token: `Bearer ${idToken}`,
    });
  }
}

export const userService = new UserService();
