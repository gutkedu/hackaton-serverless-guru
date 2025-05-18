// Sample component demonstrating how to use the returnToLobby functionality
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { lobbyService } from "@/lib/lobby-service";
import { useRouter } from "next/navigation";

interface ReturnToLobbyButtonProps {
  lobbyId: string;
  className?: string;
}

export default function ReturnToLobbyButton({
  lobbyId,
  className,
}: ReturnToLobbyButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isReturning, setIsReturning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReturnToLobby = async () => {
    if (!user?.idToken) return;

    setIsReturning(true);
    setError(null);

    try {
      const result = await lobbyService.returnToLobby(lobbyId, user.idToken);

      if (result.success) {
        // Navigate to the lobby page
        router.push(`/dashboard/lobbies/${result.lobby.id}`);
      } else {
        setError("Failed to return to lobby");
      }
    } catch (err) {
      console.error("Error returning to lobby:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to return to lobby";
      setError(errorMessage);
    } finally {
      setIsReturning(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleReturnToLobby}
        disabled={isReturning}
        className={`inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          className || ""
        }`}
      >
        {isReturning ? "Returning..." : "Return to Lobby"}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
