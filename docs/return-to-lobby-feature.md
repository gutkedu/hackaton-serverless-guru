# Return to Lobby Feature

This document describes the "Return to Lobby" feature which allows players to return to previously joined lobbies, even after browser refresh, disconnection, or app restart.

## Purpose

The Return to Lobby feature solves several problems in multiplayer game scenarios:

1. **Session Persistence**: Players can reconnect to their lobby after disconnection
2. **Game Continuity**: Games in progress can be resumed by all participants
3. **Improved UX**: Players don't lose their place when experiencing technical issues
4. **Simpler Game Recovery**: No need for complex state tracking or additional recovery mechanisms

## How It Works

### Backend Implementation

The `ReturnToLobbyUseCase` handles the logic for:

1. Verifying that the specified lobby exists
2. Checking if the player is already in that lobby
3. Removing the player from any other lobby they might currently be in
4. Adding the player to the requested lobby
5. Updating both player and lobby records

### API Endpoint

The API endpoint for returning to a lobby is:

```
POST /game/lobbies/return
```

See [return-to-lobby.md](/home/gutkedu/Programming/hackaton-serverless-guru/docs/api/return-to-lobby.md) for complete API documentation.

### Frontend Integration

The frontend service provides a simple method to use this feature:

```typescript
// Using the lobbyService
import { lobbyService } from "@/lib/lobby-service";

// Within a component or hook:
const result = await lobbyService.returnToLobby(lobbyId, idToken);
if (result.success) {
  // Navigate to lobby page or update UI
}
```

## Implementation Examples

### Basic Example

```typescript
import { useAuth } from "@/contexts/auth-context";
import { lobbyService } from "@/lib/lobby-service";

function MyComponent() {
  const { user } = useAuth();
  
  const handleReturn = async () => {
    try {
      const result = await lobbyService.returnToLobby("lobby-id-here", user.idToken);
      if (result.success) {
        console.log("Successfully returned to lobby:", result.lobby.name);
      }
    } catch (error) {
      console.error("Failed to return to lobby:", error);
    }
  };
  
  return <button onClick={handleReturn}>Return to Lobby</button>;
}
```

### Complete Component

See [ReturnToLobbyButton.tsx](/home/gutkedu/Programming/hackaton-serverless-guru/docs/examples/ReturnToLobbyButton.tsx) for a complete React component implementation.

## Use Cases

### Game Disconnection Recovery

When a player gets disconnected during a game:

1. Store the lobby ID in local storage
2. When they reconnect, check if they were previously in a lobby
3. If yes, offer them to return to that lobby
4. Use the `returnToLobby` method to reconnect them

### Cross-Device Continuation

For players who want to switch devices:

1. Store lobby IDs in user profiles or session data
2. When logging in on a new device, check if they have active lobbies
3. Allow them to select which lobby to return to
4. Use the `returnToLobby` method to join the selected lobby

## Limitations

- The lobby must still exist - if it was deleted or closed, players cannot return
- If the lobby status doesn't allow joining (e.g., it's full), return will fail
- Game state within the lobby may still be lost depending on how game state persistence is implemented

## Testing the Feature

You can test this feature using the provided HTTP requests in the documentation:

```http
### Return to previously joined lobby
POST {{url}}/game/lobbies/return
Content-Type: application/json
Authorization: Bearer {{idToken}}

{
  "lobbyId": "your-lobby-id-here"
}
```
