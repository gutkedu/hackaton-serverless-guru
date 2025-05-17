"use client";

import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { MomentoService } from "@/lib/momento-service";
import { GameEvent, GameEventType, GameStateUpdatedEvent } from "@/lib/types/game-events";
import ProtectedRoute from "@/components/protected-route";
import { useTopicsToken } from "@/hooks/use-topics-token";

interface GameState {
  content: string;
  players: Array<{
    username: string;
    score: number;
    progress: number;
  }>;
  gameStatus: 'waiting' | 'in_progress' | 'finished';
}

export default function GamePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id: gameId } = useParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    content: '',
    players: [],
    gameStatus: 'waiting',
  });
  const [userInput, setUserInput] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isCorrect, setIsCorrect] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const momentoService = MomentoService.getInstance();
  const { getToken } = useTopicsToken();

  // Subscribe to game events
  useEffect(() => {
    if (!user?.idToken || !gameId) return;

    let isSubscribed = true;

    const setupSubscription = async () => {
      try {
        // Get the token for the game topic
        const tokenResponse = await getToken("game");
        if (!tokenResponse) {
          throw new Error("Failed to get token for game");
        }

        // Initialize Momento service with the token and cache name
        await momentoService.initialize({
          token: tokenResponse.token,
          endpoint: tokenResponse.endpoint,
          cacheName: tokenResponse.cacheName
        });

        await momentoService.subscribeToLobby(
          gameId as string,
          (event) => {
            if (isSubscribed) {
              handleGameEvent(event);
            }
          },
          (error) => {
            if (isSubscribed) {
              console.error('Subscription error:', error);
              setError('Failed to connect to game events. Please refresh the page.');
            }
          }
        );
      } catch (err) {
        console.error('Failed to subscribe to game events:', err);
        if (isSubscribed) {
          setError('Failed to connect to game events. Please refresh the page.');
        }
      }
    };

    setupSubscription();

    // Cleanup subscription on unmount
    return () => {
      isSubscribed = false;
      momentoService.unsubscribeFromLobby(gameId as string).catch(console.error);
    };
  }, [user, gameId, getToken, momentoService]);

  const handleGameEvent = useCallback((event: GameEvent) => {
    console.log('Received game event:', event);

    switch (event.type) {
      case GameEventType.GAME_STARTED:
        setGameState(prev => ({
          ...prev,
          content: event.content,
          gameStatus: 'in_progress'
        }));
        if (inputRef.current) {
          inputRef.current.focus();
        }
        break;
      case GameEventType.GAME_STATE_UPDATED:
        const stateEvent = event as GameStateUpdatedEvent;
        setGameState(prev => ({
          ...prev,
          players: stateEvent.state.players,
          gameStatus: stateEvent.state.gameStatus === 'finished' ? 'finished' : prev.gameStatus
        }));
        break;
      case GameEventType.GAME_ENDED:
        router.push(`/dashboard/lobbies`);
        break;
    }
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const words = gameState.content.split(' ');
    const currentWord = words[currentWordIndex];
    const value = e.target.value;
    
    setUserInput(value);

    // Check if the current input matches the current word
    const isMatch = currentWord.startsWith(value);
    setIsCorrect(isMatch);

    // If space is pressed and the word is correct, move to next word
    if (value.endsWith(' ') && value.trim() === currentWord) {
      setCurrentWordIndex(prev => prev + 1);
      setUserInput('');
      setIsCorrect(true);

      // Calculate progress
      const progress = ((currentWordIndex + 1) / words.length) * 100;
      
      // TODO: Send progress update event
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
                <div className="space-y-4">
                  {/* Text to Type */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-lg text-gray-900 font-mono">
                      {gameState.content.split(' ').map((word, index) => (
                        <span
                          key={index}
                          className={`${
                            index === currentWordIndex
                              ? 'bg-yellow-200'
                              : index < currentWordIndex
                              ? 'text-gray-400'
                              : ''
                          }`}
                        >
                          {word}{' '}
                        </span>
                      ))}
                    </p>
                  </div>

                  {/* Input Area */}
                  <div>
                    <textarea
                      ref={inputRef}
                      value={userInput}
                      onChange={handleInputChange}
                      className={`w-full p-4 border rounded-lg font-mono text-lg ${
                        isCorrect ? 'border-gray-300' : 'border-red-500'
                      }`}
                      rows={3}
                      placeholder="Start typing here..."
                    />
                  </div>
                </div>
              ) : gameState.gameStatus === 'waiting' ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Waiting for the game to start...</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Game finished!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 