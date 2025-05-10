/**
 * Generates a consistent topic name based on a context and ID
 * @param context The context of the topic (e.g., lobby, chat)
 * @param id The specific identifier (e.g., lobbyId, chatId)
 * @returns A formatted topic name
 */
export function generateTopicName(context: string, id: string): string {
  return `${context}-${id}`
}

/**
 * Generates a topic name for a lobby
 * @param lobbyId The ID of the lobby
 * @returns A formatted lobby topic name
 */
export function generateLobbyTopicName(lobbyId: string): string {
  return generateTopicName('lobby', lobbyId)
}
