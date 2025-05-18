import { api } from "./api";

export interface GameStatistics {
  totalGamesStarted: number;
  totalGamesFinished: number;
  topPlayersScoreboard: Array<{
    username: string;
    bestWpm: number;
    gamesPlayedInvolvingScoreboard: number;
    lastGameTimestamp: string;
  }>;
}

class GameStatisticsService {
  /**
   * Get global game statistics including total games and top players
   */
  async getGameStatistics(idToken: string): Promise<GameStatistics> {
    try {
      return await api<GameStatistics>("/game/statistics", {
        method: "GET",
        token: `Bearer ${idToken}`,
      });
    } catch (error) {
      console.error("Error fetching game statistics:", error);
      throw error;
    }
  }
}

export const gameStatisticsService = new GameStatisticsService(); 