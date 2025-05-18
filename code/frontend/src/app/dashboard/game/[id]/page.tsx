"use client";

import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { MomentoService } from "@/lib/momento-service";
import { GameEvent, GameEventType, GameStateUpdatedEvent } from "@/lib/types/game-events";
import ProtectedRoute from "@/components/protected-route";
import { useTopicsToken } from "@/hooks/use-topics-token";
import { lobbyService } from "@/lib/lobby-service";

interface GameState {
  content: string;
  players: Array<{
    username: string;
    score: number;
    progress: number;
  }>;
  gameStatus: 'waiting' | 'in_progress' | 'finished';
  countdown: number | null;
}

export default function GamePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id: gameId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    content: '',
    players: [],
    gameStatus: 'waiting',
    countdown: null
  });
  const [userInput, setUserInput] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isCorrect, setIsCorrect] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const momentoService = MomentoService.getInstance();
  const { getToken } = useTopicsToken();
  const lobbyIdRef = useRef<string | null>(null);
  const lobbyId = searchParams.get('lobbyId');
  const initialContentFromQuery = searchParams.get('initialContent');
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isReturningToLobby, setIsReturningToLobby] = useState(false);

  // Effect to initialize game state from query params or if game data changes
  useEffect(() => {
    if (initialContentFromQuery && gameId && lobbyId && gameState.gameStatus === 'waiting' && !gameState.content) {
      console.log('Initializing game from query parameters:', { gameId, lobbyId });
      lobbyIdRef.current = lobbyId;
      
      setGameState(prev => ({
        ...prev,
        content: initialContentFromQuery,
        gameStatus: 'waiting',
        countdown: 5,
        players: prev.players.map(p => ({ ...p, progress: 0, score: 0 }))
      }));

      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = setInterval(() => {
        setGameState(prev => {
          if (prev.countdown === null) return prev;
          if (prev.countdown <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            if (inputRef.current) inputRef.current.focus();
            return { ...prev, gameStatus: 'in_progress', countdown: null };
          }
          return { ...prev, countdown: prev.countdown - 1 };
        });
      }, 1000);

      setCurrentWordIndex(0);
      setUserInput('');
      setIsCorrect(true);
    }
  }, [initialContentFromQuery, gameId, lobbyId, gameState.gameStatus, gameState.content]);

  // Cleanup countdown interval on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const handleGameEvent = useCallback((event: GameEvent) => {
    // Critical: Filter events for the current gameId!
    if (event.gameId !== gameId) {
      // console.log('GamePage: Ignoring event for different gameId:', event.gameId, 'Current gameId:', gameId);
      return;
    }
    // Also ensure lobbyId matches if events carry it explicitly and it's relevant for filtering
    if (event.lobbyId && event.lobbyId !== lobbyIdRef.current && event.lobbyId !== lobbyId) {
      // console.log('GamePage: Ignoring event for different lobbyId:', event.lobbyId, 'Current lobbyId:', lobbyIdRef.current || lobbyId);
      return;
    }

    console.log('GamePage: Received game event for current game:', event);

    switch (event.type) {
      case GameEventType.GAME_STARTED:
        // This case might now be redundant if initialContentFromQuery handles setup.
        // However, it can act as a fallback or for re-joining if the backend resends GAME_STARTED.
        // Ensure we don't re-initialize if already started from initialContent or a previous GAME_STARTED event.
        if (gameState.gameStatus === 'waiting' && !gameState.content && event.content) {
          console.log('GamePage: GAME_STARTED event initializing game state (fallback/live)');
          lobbyIdRef.current = event.lobbyId; // Ensure lobbyIdRef is set
          setGameState(prev => ({
            ...prev,
            content: event.content,
            countdown: 5,
            players: prev.players.map(p => ({ ...p, progress: 0, score: 0 }))
          }));
          // Start countdown (copied from above, ensure this is not duplicated if called from initial setup too)
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = setInterval(() => {
            setGameState(prev => {
              if (prev.countdown === null) return prev;
              if (prev.countdown <= 1) {
                if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                if (inputRef.current) inputRef.current.focus();
                return { ...prev, gameStatus: 'in_progress', countdown: null };
              }
              return { ...prev, countdown: prev.countdown - 1 };
            });
          }, 1000);
          setCurrentWordIndex(0);
          setUserInput('');
          setIsCorrect(true);
        } else {
          console.log('GamePage: GAME_STARTED event received but game already initialized or no content.');
        }
        break;
      case GameEventType.GAME_STATE_UPDATED:
        const stateEvent = event as GameStateUpdatedEvent;
        setGameState(prev => ({
          ...prev,
          players: stateEvent.state.players.map(player => ({
            ...player,
            progress: Math.min(player.progress, 100) // Ensure progress doesn't exceed 100%
          })),
          gameStatus: stateEvent.state.gameStatus === 'finished' ? 'finished' : prev.gameStatus,
          countdown: prev.countdown // Preserve countdown state
        }));
        break;
      case GameEventType.GAME_ENDED:
        setGameState(prev => ({
          ...prev,
          gameStatus: 'finished',
          countdown: null
        }));
        // Add a small delay before redirecting to ensure the user sees they finished
        // setTimeout(() => {
        //   router.push(`/dashboard/lobbies`);
        // }, 2000); // Removed redirection
        console.log("Game ended. Staying on GamePage for now.");
        break;
    }
  }, [router, gameId]);

  // Subscribe to game events (now for the lobby topic)
  useEffect(() => {
    if (!user?.idToken || !lobbyId || !gameId) { 
      console.error('GamePage: Missing required parameters for subscription:', { lobbyId, gameId, userIdToken: !!user?.idToken });
      setError('Missing required game parameters for subscription');
      return;
    }

    const momentoService = MomentoService.getInstance();
    let isSubscribed = true;

    const setupSubscription = async () => {
      try {
        const tokenResponse = await getToken("lobby");
        if (!tokenResponse) {
          throw new Error("GamePage: Failed to get token for lobby events");
        }

        await momentoService.initialize({
          token: tokenResponse.token,
          endpoint: tokenResponse.endpoint,
          cacheName: tokenResponse.cacheName
        });

        await momentoService.subscribeToLobby(
          lobbyId,
          (event) => {
            if (isSubscribed) {
              handleGameEvent(event);
            }
          },
          (error) => {
            if (isSubscribed) {
              console.error('GamePage: Lobby subscription error:', error);
              setError('Failed to connect to lobby events. Please refresh the page.');
            }
          }
        );
        console.log(`GamePage: Successfully set up subscription to lobby ${lobbyId} for game ${gameId}`);
      } catch (err) {
        console.error('GamePage: Failed to subscribe to lobby events:', err);
        if (isSubscribed) {
          setError('Failed to connect to lobby events. Please refresh the page.');
        }
      }
    };

    setupSubscription();

    return () => {
      isSubscribed = false;
      if (lobbyId) {
        momentoService.unsubscribeFromLobby(lobbyId).catch(console.error);
      }
    };
  }, [user, lobbyId, gameId, getToken, handleGameEvent]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (gameState.gameStatus !== 'in_progress' || !lobbyIdRef.current) return;
    
    const words = gameState.content.split(' ');
    // Ensure currentWordIndex is within bounds
    if (currentWordIndex >= words.length) {
      // This case should ideally not be reached if game ends correctly
      console.warn("Attempting to process input after all words are typed.");
      return;
    }
    const currentWord = words[currentWordIndex];
    const value = e.target.value;
    
    // Prevent typing spaces if the word itself doesn't end with a space (unless it's the exact word match)
    // Or, more simply, disallow leading/multiple spaces within a word.
    // For now, let's assume single words don't have spaces. If they do, this needs more thought.
    // The main change is advancing without needing a final space.

    setUserInput(value);

    // Check if the current input prefix matches the current word
    const isMatch = currentWord.startsWith(value);
    setIsCorrect(isMatch);

    // If the typed value exactly matches the current word, move to the next word
    if (value === currentWord) {
      const newWordIndex = currentWordIndex + 1;
      setCurrentWordIndex(newWordIndex);
      setUserInput(''); // Clear input for the next word
      setIsCorrect(true); // Reset for the next word

      // Calculate progress
      const progress = (newWordIndex / words.length) * 100;
      
      // Send progress update event
      const progressEvent = {
        type: GameEventType.GAME_STATE_UPDATED,
        state: {
          players: [
            {
              username: user?.username || 'Anonymous',
              progress,
              score: 0 // Score can be calculated based on time/accuracy if needed
            }
          ],
          gameStatus: progress >= 100 ? 'finished' : 'in_progress'
        },
        timestamp: Date.now(),
        gameId: gameId as string,
        lobbyId: lobbyIdRef.current
      };

      momentoService.publish(`lobby-${lobbyIdRef.current}`, JSON.stringify(progressEvent))
        .catch((error: Error) => {
          console.error('Failed to send progress update:', error);
          setError('Failed to send progress update');
        });

      // If game is finished (all words typed)
      if (newWordIndex >= words.length) {
        setGameState(prev => ({...prev, gameStatus: 'finished'})); // Update local game status immediately
        const gameEndedEvent = {
          type: GameEventType.GAME_ENDED,
          gameId: gameId as string,
          lobbyId: lobbyIdRef.current,
          timestamp: Date.now()
        };

        momentoService.publish(`lobby-${lobbyIdRef.current}`, JSON.stringify(gameEndedEvent))
          .catch((error: Error) => {
            console.error('Failed to send game ended event:', error);
            setError('Failed to send game ended event');
          });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === ' ') {
      e.preventDefault(); // Prevent space from being typed into the textarea
    }
  };

  const handleReturnToLobby = async () => {
    if (!lobbyId || !user?.idToken) {
      setError("Cannot return to lobby: Missing lobby ID or user token.");
      return;
    }
    setIsReturningToLobby(true);
    setError(null);
    try {
      const response = await lobbyService.returnToLobby(lobbyId, user.idToken);
      if (response.success && response.lobby && response.lobby.id) {
        console.log(`Successfully called returnToLobby endpoint for lobby ${response.lobby.id}, navigating directly...`);
        router.push(`/dashboard/lobbies/${response.lobby.id}`);
      } else {
        const errorMessage = (response.lobby as any)?.error || response.lobby?.toString() || "Failed to return to lobby via API or missing lobby data in response.";
        console.error("API call to returnToLobby did not indicate success or missing lobby ID in response:", response);
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Error calling returnToLobby service:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred while trying to return to lobby.");
    } finally {
      setIsReturningToLobby(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            {/* Game Status */}
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Typing Race
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Game Status: {gameState.gameStatus}
              </p>
            </div>

            {/* Players Progress */}
            <div className="px-4 py-5 sm:px-6">
              <h4 className="text-sm font-medium text-gray-500">Players Progress</h4>
              <div className="mt-3 space-y-4">
                {gameState.players.map((player) => (
                  <div key={player.username} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {player.username} {player.username === user?.username && "(You)"}
                      </span>
                      <span className="text-sm text-gray-500">
                        {Math.round(player.progress)}%
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${player.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Game Content */}
            <div className="px-4 py-5 sm:px-6">
              {gameState.gameStatus === 'in_progress' ? (
                <div className="space-y-6">
                  {/* Text to Type */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-lg leading-relaxed font-mono whitespace-pre-wrap">
                      {(() => {
                        if (!gameState.content) return null;
                        const fullText = gameState.content;
                        const words = fullText.split(' ');
                        let globalCharIndex = 0;

                        return words.map((word, wordIndex) => {
                          const wordSpan = (
                            <span key={`word-${wordIndex}`}>
                              {word.split('').map((char, charInWordIndex) => {
                                let style = 'text-gray-800'; // Default: untyped

                                if (wordIndex < currentWordIndex) {
                                  style = 'text-green-600'; // Fully typed past word
                                } else if (wordIndex === currentWordIndex) {
                                  if (charInWordIndex < userInput.length) {
                                    if (userInput[charInWordIndex] === char) {
                                      style = 'text-green-600'; // Current word, typed correctly
                                    } else {
                                      style = 'text-red-600 bg-red-100'; // Current word, typed incorrectly
                                    }
                                  } else if (charInWordIndex === userInput.length) {
                                    style = 'bg-yellow-200 border-b-2 border-black animate-pulse'; // Cursor position
                                  }
                                  // Characters in current word beyond userInput.length remain default (text-gray-800)
                                }
                                // Characters in future words (wordIndex > currentWordIndex) remain default (text-gray-800)
                                
                                const charElement = (
                                  <span key={`char-${globalCharIndex}`} className={style}>
                                    {char}
                                  </span>
                                );
                                globalCharIndex++;
                                return charElement;
                              })}
                            </span>
                          );
                          // Add space between words, unless it's the last word
                          if (wordIndex < words.length - 1) {
                            const spaceElement = (
                              <span key={`space-${globalCharIndex}`} className={wordIndex < currentWordIndex ? 'text-green-600' : 'text-gray-800'}>
                                {' '}
                              </span>
                            );
                            globalCharIndex++;
                            return [wordSpan, spaceElement];
                          }
                          return wordSpan;
                        }).flat();
                      })()}
                    </p>
                  </div>

                  {/* Input Area */}
                  <div className="space-y-4">
                    <div className="relative">
                      <textarea
                        ref={inputRef}
                        value={userInput}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        className={`w-full p-4 border-2 rounded-lg font-mono text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          isCorrect 
                            ? 'border-green-300 focus:ring-green-500' 
                            : 'border-red-300 focus:ring-red-500'
                        }`}
                        rows={3}
                        placeholder="Start typing here..."
                        autoFocus
                      />
                      <div className="absolute top-2 right-2 px-2 py-1 rounded text-sm">
                        {isCorrect ? (
                          <span className="text-green-600">✓ Correct</span>
                        ) : (
                          <span className="text-red-600">✗ Incorrect</span>
                        )}
                      </div>
                    </div>

                    {/* Typing Stats */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-500">Words</div>
                        <div className="text-xl font-semibold">
                          {currentWordIndex} / {gameState.content.split(' ').length}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-500">Progress</div>
                        <div className="text-xl font-semibold">
                          {Math.round((currentWordIndex / gameState.content.split(' ').length) * 100)}%
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-500">Position</div>
                        <div className="text-xl font-semibold">
                          {gameState.players.sort((a, b) => b.progress - a.progress)
                            .findIndex(p => p.username === user?.username) + 1} / {gameState.players.length}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Players Progress Bars */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">Race Progress</h4>
                    {gameState.players
                      .sort((a, b) => b.progress - a.progress)
                      .map((player, index) => (
                        <div key={player.username} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center space-x-2">
                              <span className={`text-sm font-medium ${
                                player.username === user?.username 
                                  ? 'text-blue-600' 
                                  : 'text-gray-900'
                              }`}>
                                {index + 1}. {player.username}
                                {player.username === user?.username && " (You)"}
                              </span>
                            </span>
                            <span className="text-sm text-gray-500">
                              {Math.round(player.progress)}%
                            </span>
                          </div>
                          <div className="relative">
                            <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                              <div
                                style={{ width: `${player.progress}%` }}
                                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                                  player.username === user?.username
                                    ? 'bg-blue-500'
                                    : 'bg-gray-500'
                                } transition-all duration-300`}
                              />
                            </div>
                            {/* Car/Player indicator */}
                            <div 
                              className={`absolute top-1/2 transform -translate-y-1/2 transition-all duration-300 text-lg`}
                              style={{ left: `${player.progress}%` }}
                            >
                              🚗
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              ) : gameState.gameStatus === 'waiting' ? (
                <div className="text-center py-8 space-y-4">
                  <div className={`${gameState.countdown !== null ? 'animate-bounce' : 'animate-pulse'}`}>
                    {gameState.countdown !== null ? (
                      <>
                        <p className="text-6xl font-bold text-blue-600 mb-4">{gameState.countdown}</p>
                        <p className="text-xl font-semibold text-gray-700">Get ready to type!</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xl font-semibold text-gray-700">Get Ready!</p>
                        <p className="text-gray-500">Waiting for the game to start...</p>
                      </>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Players in lobby: {gameState.players.length}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">Game Finished!</h3>
                  <div className="space-y-2">
                    {gameState.players
                      .sort((a, b) => b.progress - a.progress)
                      .map((player, index) => (
                        <div key={player.username} className={`text-lg ${
                          index === 0 ? 'text-yellow-600 font-bold' : 'text-gray-600'
                        }`}>
                          {index + 1}. {player.username} - {Math.round(player.progress)}%
                          {player.username === user?.username && " (You)"}
                        </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={handleReturnToLobby}
                      disabled={isReturningToLobby}
                      className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                    >
                      {isReturningToLobby ? 'Returning...' : 'Return to Lobby List'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 