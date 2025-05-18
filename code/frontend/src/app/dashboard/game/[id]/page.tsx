"use client";

import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { MomentoService } from "@/lib/momento-service";
import { GameEvent, GameEventType, GameStateUpdatedEvent, GameEndedEvent } from "@/lib/types/game-events";
import ProtectedRoute from "@/components/protected-route";
import { useTopicsToken } from "@/hooks/use-topics-token";
import { lobbyService } from "@/lib/lobby-service";
import { useTheme } from "@/app/layout";
import { gameService } from "@/lib/game-service";

interface GameState {
  content: string;
  players: Array<{
    username: string;
    wpm: number;
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
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
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
  const wpmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number | null>(null);

  // WPM related state
  const [startTime, setStartTime] = useState<number | null>(null);
  const [correctCharsCount, setCorrectCharsCount] = useState(0);
  const [wpm, setWpm] = useState(0);

  // Add cleanup for WPM interval
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (wpmIntervalRef.current) {
        clearInterval(wpmIntervalRef.current);
      }
    };
  }, []);

  // Start WPM tracking when game starts
  useEffect(() => {
    if (gameState.gameStatus === 'in_progress' && startTime) {
      // Clear any existing interval
      if (wpmIntervalRef.current) {
        clearInterval(wpmIntervalRef.current);
      }

      // Update WPM every second
      wpmIntervalRef.current = setInterval(() => {
        const currentTime = Date.now();
        const elapsedTimeInMinutes = (currentTime - startTime) / 60000;
        
        // If there's been no activity in the last 2 seconds, adjust WPM calculation
        if (lastActivityRef.current && (currentTime - lastActivityRef.current) > 2000) {
          const inactiveTimeInMinutes = (currentTime - lastActivityRef.current) / 60000;
          const adjustedWpm = Math.max(0, Math.round((correctCharsCount / 5) / (elapsedTimeInMinutes + inactiveTimeInMinutes)));
          setWpm(adjustedWpm);
        } else if (elapsedTimeInMinutes > 0) {
          const calculatedWpm = Math.round((correctCharsCount / 5) / elapsedTimeInMinutes);
          setWpm(calculatedWpm);
        }
      }, 1000);
    }

    return () => {
      if (wpmIntervalRef.current) {
        clearInterval(wpmIntervalRef.current);
      }
    };
  }, [gameState.gameStatus, startTime, correctCharsCount]);

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
        players: prev.players.map(p => ({ ...p, progress: 0, wpm: 0 }))
      }));

      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = setInterval(() => {
        setGameState(prev => {
          if (prev.countdown === null) return prev;
          if (prev.countdown <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            if (inputRef.current) inputRef.current.focus();
            // Game starts now, record start time for WPM
            setStartTime(Date.now());
            setCorrectCharsCount(0);
            setWpm(0);
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
      return;
    }
    // Also ensure lobbyId matches if events carry it explicitly and it's relevant for filtering
    if (event.lobbyId && event.lobbyId !== lobbyIdRef.current && event.lobbyId !== lobbyId) {
      return;
    }

    console.log('GamePage: Received game event for current game:', event);

    const handleGameEnd = async (finalPlayersFromEvent?: GameEndedEvent['players']) => {
      console.log('Starting game end process', {
        lobbyId: lobbyIdRef.current,
        // Log which player list is being considered
        playersSource: finalPlayersFromEvent ? 'event' : 'gameState',
        eventPlayers: finalPlayersFromEvent,
        gameStatePlayers: gameState.players,
        userIdToken: !!user?.idToken
      });

      setGameState(prev => ({
        ...prev,
        gameStatus: 'finished',
        countdown: null
      }));

      // Call the game/end route with the final game state
      if (user?.idToken) {
        try {
          const currentLobbyId = lobbyIdRef.current;
          const currentPlayers = finalPlayersFromEvent || gameState.players;

          if (!currentLobbyId || typeof currentLobbyId !== 'string' || currentLobbyId.trim() === '') {
            console.error('GamePage: Invalid or missing lobbyId for endGame:', currentLobbyId);
            setError('Failed to end game: Invalid lobby ID.');
            return;
          }

          if (!Array.isArray(currentPlayers)) {
            console.error('GamePage: Invalid players data for endGame (from event or gameState):', currentPlayers);
            setError('Failed to end game: Players data is not an array.');
            return;
          }

          const payload = {
            lobbyId: currentLobbyId,
            players: currentPlayers.map(player => ({
              username: player.username,
              wpm: player.wpm,
              progress: player.progress
            }))
          };
          console.log('Sending game end request with payload:', payload);
          
          await gameService.endGame(payload, user.idToken);
          console.log('Successfully sent game end data to API');
        } catch (error) {
          console.error('Failed to send game end data:', error);
          setError('Failed to send game end data');
        }
      }

      console.log("Game ended. Staying on GamePage for now.");
    };

    switch (event.type) {
      case GameEventType.GAME_STARTED:
        // This case might now be redundant if initialContentFromQuery handles setup.
        // However, it can act as a fallback or for re-joining if the backend resends GAME_STARTED.
        if (gameState.gameStatus === 'waiting' && !gameState.content && event.content) {
          console.log('GamePage: GAME_STARTED event initializing game state (fallback/live)');
          lobbyIdRef.current = event.lobbyId; // Ensure lobbyIdRef is set
          setGameState(prev => ({
            ...prev,
            content: event.content,
            countdown: 5,
            players: prev.players.map(p => ({ ...p, progress: 0, wpm: 0 }))
          }));
          // Start countdown (copied from above, ensure this is not duplicated if called from initial setup too)
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = setInterval(() => {
            setGameState(prev => {
              if (prev.countdown === null) return prev;
              if (prev.countdown <= 1) {
                if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                if (inputRef.current) inputRef.current.focus();
                // Game starts now, record start time for WPM
                setStartTime(Date.now());
                setCorrectCharsCount(0);
                setWpm(0);
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
        setGameState(prev => {
          // Create a map of existing players for easy lookup
          const existingPlayers = new Map(prev.players.map(p => [p.username, p]));
          
          // Update or add new players while preserving existing player data
          stateEvent.state.players.forEach(player => {
            if (existingPlayers.has(player.username)) {
              const existing = existingPlayers.get(player.username)!;
              existingPlayers.set(player.username, {
                ...existing,
                progress: Math.min(player.progress, 100), // Ensure progress doesn't exceed 100%
                wpm: player.wpm
              });
            } else {
              existingPlayers.set(player.username, {
                ...player,
                progress: Math.min(player.progress, 100)
              });
            }
          });

          return {
            ...prev,
            players: Array.from(existingPlayers.values()),
            gameStatus: stateEvent.state.gameStatus === 'finished' ? 'finished' : prev.gameStatus,
            countdown: prev.countdown // Preserve countdown state
          };
        });
        break;
      case GameEventType.GAME_ENDED:
        const endedEvent = event as GameEndedEvent;
        handleGameEnd(endedEvent.players).catch(error => {
          console.error('Error handling game end:', error);
          setError('Failed to handle game end');
        });
        break;
    }
  }, [router, gameId, user, gameState.players]);

  // Subscribe to game events (both lobby and game topics)
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
          throw new Error("GamePage: Failed to get token for game events");
        }

        await momentoService.initialize({
          token: tokenResponse.token,
          endpoint: tokenResponse.endpoint,
          cacheName: tokenResponse.cacheName
        }, user.idToken);

        // Subscribe to both lobby and game topics
        await Promise.all([
          momentoService.subscribeToLobby(
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
          ),
          momentoService.subscribeToGame(
            gameId,
            (event) => {
              if (isSubscribed) {
                handleGameEvent(event);
              }
            },
            (error) => {
              if (isSubscribed) {
                console.error('GamePage: Game subscription error:', error);
                setError('Failed to connect to game events. Please refresh the page.');
              }
            }
          )
        ]);
        
        console.log(`GamePage: Successfully set up subscriptions for lobby ${lobbyId} and game ${gameId}`);
      } catch (err) {
        console.error('GamePage: Failed to subscribe to events:', err);
        if (isSubscribed) {
          setError('Failed to connect to game events. Please refresh the page.');
        }
      }
    };

    setupSubscription();

    return () => {
      isSubscribed = false;
      if (lobbyId) {
        momentoService.unsubscribeFromLobby(lobbyId).catch(console.error);
      }
      if (gameId) {
        momentoService.unsubscribeFromGame(gameId).catch(console.error);
      }
    };
  }, [user, lobbyId, gameId, getToken, handleGameEvent]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (gameState.gameStatus !== 'in_progress' || !lobbyIdRef.current) return;
    
    const currentTime = Date.now();
    lastActivityRef.current = currentTime;
    
    const words = gameState.content.split(' ');
    if (currentWordIndex >= words.length) {
      console.warn("Attempting to process input after all words are typed.");
      return;
    }
    const currentWord = words[currentWordIndex];
    const value = e.target.value;
    
    setUserInput(value);
    const isMatch = currentWord.startsWith(value);
    setIsCorrect(isMatch);

    if (value === currentWord) {
      const newWordIndex = currentWordIndex + 1;
      setCurrentWordIndex(newWordIndex);
      setUserInput('');
      setIsCorrect(true);

      // WPM Calculation
      let charsInWord = currentWord.length;
      if (newWordIndex < words.length) {
        charsInWord += 1;
      }
      const newCorrectChars = correctCharsCount + charsInWord;
      setCorrectCharsCount(newCorrectChars);

      if (startTime) {
        const elapsedTimeInMinutes = (currentTime - startTime) / 60000;
        const timeSinceLastInput = currentTime - (lastActivityRef.current || currentTime);
        
        if (timeSinceLastInput <= 2000 && elapsedTimeInMinutes > 0) {
          const calculatedWpm = Math.round((newCorrectChars / 5) / elapsedTimeInMinutes);
          setWpm(calculatedWpm);
        } else if (elapsedTimeInMinutes > 0) {
          const adjustedTime = elapsedTimeInMinutes + (timeSinceLastInput / 60000);
          const adjustedWpm = Math.max(0, Math.round((newCorrectChars / 5) / adjustedTime));
          setWpm(adjustedWpm);
        }
      }

      const progress = (newWordIndex / words.length) * 100;
      
      const progressEvent = {
        type: GameEventType.GAME_STATE_UPDATED,
        state: {
          players: [
            {
              username: user?.username || 'Anonymous',
              progress,
              wpm
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

      if (newWordIndex >= words.length) {
        setGameState(prev => ({...prev, gameStatus: 'finished'}));

        // Ensure the current player's final stats are accurately reflected in the event
        let finalPlayersList = gameState.players.map(p => {
          if (p.username === user?.username) {
            // User who finished: update their progress to 100 and use current WPM
            return { ...p, progress: 100, wpm: wpm };
          }
          return p; // Other players remain as they are in current gameState
        });

        // If the current user was not in the gameState.players list for some reason (e.g. solo play, new player)
        // ensure they are added.
        if (user?.username && !finalPlayersList.some(p => p.username === user.username)) {
          finalPlayersList.push({
            username: user.username,
            progress: 100,
            wpm: wpm
          });
        }
        
        const gameEndedEvent = {
          type: GameEventType.GAME_ENDED,
          gameId: gameId as string,
          lobbyId: lobbyIdRef.current,
          timestamp: Date.now(),
          players: finalPlayersList // Use the accurately constructed list
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
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} py-8 transition-colors duration-300`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className={`rounded-md ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'} p-4 mb-6 transition-colors duration-300`}>
              <div className="flex">
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${isDarkMode ? 'text-red-200' : 'text-red-800'} transition-colors duration-300`}>{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm rounded-lg overflow-hidden transition-colors duration-300`}>
            {/* Game Status */}
            <div className={`px-4 py-5 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} sm:px-6 transition-colors duration-300`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`text-lg leading-6 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                    Typing Race
                  </h3>
                  <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300`}>
                    Game Status: {gameState.gameStatus}
                  </p>
                </div>
                {/* Stats Display */}
                <div className="flex space-x-4">
                  <div className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <div className="text-sm font-medium">WPM</div>
                    <div className={`text-xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{wpm}</div>
                  </div>
                  <div className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <div className="text-sm font-medium">Progress</div>
                    <div className={`text-xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {Math.round((currentWordIndex / (gameState.content?.split(' ').length || 1)) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Game Content */}
            <div className="px-4 py-5 sm:px-6">
              {gameState.gameStatus === 'in_progress' ? (
                <div className="space-y-6">
                  {/* Race Track */}
                  <div className="space-y-4">
                    <h4 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>Race Track</h4>
                    {gameState.players
                      .sort((a, b) => b.progress - a.progress)
                      .map((player, index) => (
                        <div key={player.username} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center space-x-2">
                              <span className={`text-sm font-medium ${
                                player.username === user?.username 
                                  ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                  : isDarkMode ? 'text-white' : 'text-gray-900'
                              } transition-colors duration-300`}>
                                {index + 1}. {player.username}
                                {player.username === user?.username && " (You)"}
                              </span>
                            </span>
                            <div className="flex items-center space-x-4">
                              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300`}>
                                WPM: {Math.round(player.wpm)}
                              </span>
                              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300`}>
                                {Math.round(player.progress)}%
                              </span>
                              {index === 0 && <span className="text-yellow-500">👑</span>}
                            </div>
                          </div>
                          <div className="relative h-6 mb-4">
                            <div className={`overflow-hidden h-3 text-xs flex rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} transition-colors duration-300`}>
                              <div
                                style={{ width: `${player.progress}%` }}
                                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                                  player.username === user?.username
                                    ? isDarkMode ? 'bg-blue-500' : 'bg-blue-600'
                                    : isDarkMode ? 'bg-red-500' : 'bg-red-600'
                                } transition-all duration-300 rounded-full`}
                              />
                            </div>
                            {/* Car/Player indicator */}
                            <div 
                              className="absolute top-1/2 transform -translate-y-1/2 transition-all duration-300 text-lg"
                              style={{ 
                                left: `${player.progress}%`, 
                                transform: `translate(-50%, -50%) scaleX(-1)` 
                              }}
                            >
                              {player.username === user?.username ? '🏎️' : '🚗'}
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>

                  {/* Text to Type */}
                  <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-6 rounded-lg transition-colors duration-300`}>
                    <p className={`text-lg leading-relaxed font-mono whitespace-pre-wrap ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} transition-colors duration-300`}>
                      {(() => {
                        if (!gameState.content) return null;
                        const fullText = gameState.content;
                        const words = fullText.split(' ');
                        let globalCharIndex = 0;

                        return words.map((word, wordIndex) => {
                          const wordSpan = (
                            <span key={`word-${wordIndex}`}>
                              {word.split('').map((char, charIndex) => {
                                const isCurrentWord = wordIndex === currentWordIndex;
                                const charClass = isCurrentWord
                                  ? charIndex < userInput.length
                                    ? userInput[charIndex] === char
                                      ? isDarkMode ? 'text-green-400' : 'text-green-600'
                                      : isDarkMode ? 'text-red-400' : 'text-red-600'
                                    : isDarkMode ? 'text-gray-100' : 'text-gray-900'
                                  : wordIndex < currentWordIndex
                                  ? isDarkMode ? 'text-green-400' : 'text-green-600'
                                  : isDarkMode ? 'text-gray-100' : 'text-gray-900';

                                return (
                                  <span
                                    key={`char-${globalCharIndex++}`}
                                    className={`${charClass} transition-colors duration-300`}
                                  >
                                    {char}
                                  </span>
                                );
                              })}
                              {wordIndex < words.length - 1 ? ' ' : ''}
                            </span>
                          );
                          return wordSpan;
                        });
                      })()}
                    </p>
                  </div>

                  {/* Input Area */}
                  <div>
                    <textarea
                      ref={inputRef}
                      value={userInput}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className={`w-full p-4 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:ring-2 ${
                        isCorrect 
                          ? isDarkMode ? 'focus:ring-blue-500 focus:border-blue-500' : 'focus:ring-blue-500 focus:border-blue-500'
                          : isDarkMode ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-red-500 focus:border-red-500'
                      } transition-colors duration-300`}
                      placeholder="Type here..."
                      rows={3}
                    />
                  </div>
                </div>
              ) : gameState.gameStatus === 'waiting' ? (
                <div className="text-center py-8 space-y-4">
                  <div className={`${gameState.countdown !== null ? 'animate-bounce' : 'animate-pulse'}`}>
                    {gameState.countdown !== null ? (
                      <>
                        <p className={`text-6xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} mb-4 transition-colors duration-300`}>{gameState.countdown}</p>
                        <p className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} transition-colors duration-300`}>Get ready to type!</p>
                      </>
                    ) : (
                      <>
                        <p className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} transition-colors duration-300`}>Get Ready!</p>
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>Waiting for the game to start...</p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>Game Finished!</h3>
                  
                  {/* Final Results */}
                  <div className="space-y-4">
                    <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} p-6 rounded-lg shadow transition-colors duration-300`}>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300`}>Your WPM</div>
                          <div className={`text-3xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} transition-colors duration-300`}>
                            {wpm}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300`}>Final Position</div>
                          <div className={`text-3xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} transition-colors duration-300`}>
                            {(gameState.players.sort((a, b) => b.progress - a.progress)
                              .findIndex(p => p.username === user?.username) + 1)} / {gameState.players.length}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Final Rankings */}
                    <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} p-6 rounded-lg shadow transition-colors duration-300`}>
                      <h4 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>Final Rankings</h4>
                      <div className="space-y-3">
                        {gameState.players
                          .sort((a, b) => b.progress - a.progress)
                          .map((player, index) => (
                            <div key={player.username} 
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                player.username === user?.username
                                  ? isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                                  : ''
                              } transition-colors duration-300`}
                            >
                              <div className="flex items-center space-x-3">
                                <span className={`text-2xl ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-yellow-600' : ''}`}>
                                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                                </span>
                                <span className={`text-lg ${
                                  player.username === user?.username
                                    ? isDarkMode ? 'text-blue-400 font-bold' : 'text-blue-600 font-bold'
                                    : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  {player.username}
                                  {player.username === user?.username && " (You)"}
                                </span>
                              </div>
                              <div className={`text-lg font-medium ${
                                index === 0 
                                  ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                                  : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                {Math.round(player.progress)}%
                              </div>
                            </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={handleReturnToLobby}
                      disabled={isReturningToLobby}
                      className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                        isDarkMode
                          ? 'bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600'
                          : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300`}
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