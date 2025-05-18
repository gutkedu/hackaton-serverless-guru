# Return to Lobby API

This API endpoint allows players to return to a previously joined lobby, even after disconnection or closing the application. This is particularly useful for maintaining game state across multiple sessions or recovering from disconnections.

When a player returns to a lobby that was previously in an IN_GAME state, the lobby status will be automatically reset to OPEN. This makes this endpoint ideal for handling game completion scenarios and allowing players to restart games.

## Endpoint

```
POST /game/lobbies/return
```

## Authentication

This endpoint requires authentication via a Bearer token.

```
Authorization: Bearer <idToken>
```

## Request Body

```json
{
  "lobbyId": "2xCf80nIdnid0CGoG2gFR5ZCWnC"
}
```

| Parameter | Type   | Description                                   | Required |
|-----------|--------|-----------------------------------------------|----------|
| lobbyId   | string | The ID of the lobby the player wants to rejoin | Yes      |

## Responses

### Success Response

**Status Code:** 200 OK

```json
{
  "success": true,
  "lobby": {
    "id": "2xCf80nIdnid0CGoG2gFR5ZCWnC",
    "name": "Sample Lobby",
    "status": "OPEN"
  }
}
```

### Error Responses

**Status Code:** 400 Bad Request

```json
{
  "error": "Lobby not found"
}
```

**Status Code:** 400 Bad Request

```json
{
  "error": "Failed to join lobby. It may be full."
}
```

**Status Code:** 401 Unauthorized

```json
{
  "message": "Unauthorized - User information not found"
}
```

## Usage Notes

1. If a player is already in the specified lobby, the API will return success and update the lobby status if needed.
2. If a player is in a different lobby, they will automatically leave that lobby before joining the requested one.
3. If the lobby is full or in a state that doesn't allow joining, an appropriate error will be returned.
4. This endpoint can be used to re-establish connections after a player disconnects or refreshes their browser.
5. **Game Status Reset**: When returning to a lobby that was in an IN_GAME state, the status will be automatically changed to OPEN, allowing for game restart.

## Example

```http
POST /game/lobbies/return
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "lobbyId": "2xCf80nIdnid0CGoG2gFR5ZCWnC"
}
```

## Implementation Notes

The backend uses a ReturnToLobbyUseCase that handles the complexities of:
1. Checking if the player is already in the requested lobby
2. Removing the player from any other lobby they may be in
3. Adding the player to the requested lobby if they're not already a member
4. Updating the lobby status from IN_GAME to OPEN if a game has ended
5. Updating both player and lobby records in the database
