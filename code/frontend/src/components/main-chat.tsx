"use client";

import { useAuth } from "@/contexts/auth-context";
import { useTopicsToken } from "@/hooks/use-topics-token";
import {
  TopicClient,
  CredentialProvider,
  TopicItem,
  TopicConfigurations,
  TopicSubscribeResponse,
} from "@gomomento/sdk-web";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "@/app/layout";

interface Message {
  id: string;
  author: string;
  text: string;
  timestamp: number;
}

export default function MainChat() {
  const { user } = useAuth();
  const { getToken } = useTopicsToken();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const topicClientRef = useRef<TopicClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // Track sent message IDs to avoid duplicates
  const sentMessageIds = useRef<Set<string>>(new Set());
  // We've removed the automatic retry mechanism in favor of a manual reconnect button

  // Define the subscription error handler function
  const handleSubscriptionError = (error: any) => {
    console.error("Subscription error:", error);
    const errorMessage = String(error);
    setError(`Subscription error: ${errorMessage}`);
    setIsConnected(false);

    // No automatic reconnection - just set the error state so user can manually reconnect
    if (
      errorMessage.includes("token is expired") ||
      errorMessage.includes("token expired") ||
      errorMessage.includes("Authorization token")
    ) {
      setError(
        `Authentication token expired. Please click "Reconnect" to reestablish connection.`
      );
    }
  };

  // Automatically scroll to the bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Use a ref to track the last token we used to avoid unnecessary reinitializations
  const lastTokenUsed = useRef<string | null>(null);

  // Define initTopicClient function outside useEffect so it can be called from elsewhere
  const initTopicClient = async () => {
    try {
      setError(null);

      // Get the main-chat token
      const token = await getToken("main-chat");
      if (!token) {
        setError("Failed to get token for main-chat");
        return;
      }

      // Don't reinitialize with the same token we already have
      if (
        token?.token === lastTokenUsed.current &&
        topicClientRef.current &&
        isConnected
      ) {
        console.log("Already initialized with this token, skipping");
        return;
      }

      lastTokenUsed.current = token?.token;

      // Get the cache name from the auth context
      const cacheName = user?.topicsTokens?.["main-chat"]?.cacheName;
      if (!cacheName) {
        setError("Failed to get cache name for main-chat");
        return;
      }

      // Create a new topic client
      const client = new TopicClient({
        configuration: TopicConfigurations.Browser.latest(),
        credentialProvider: CredentialProvider.fromString(token?.token),
      });

      topicClientRef.current = client;
      setIsConnected(true);

      // Subscribe to the main-chat topic
      const response = await client.subscribe(
        cacheName,
        "main-chat",
        {
          onItem: handleMessageReceived,
          onError: handleSubscriptionError,
        }
      );

      if (response.type === TopicSubscribeResponse.Error) {
        const errorMessage = String(response);
        setError(`Failed to subscribe: ${errorMessage}`);
        setIsConnected(false);

        // No automatic reconnection - let user handle manually with the reconnect button
        if (
          errorMessage.includes("token is expired") ||
          errorMessage.includes("token expired") ||
          errorMessage.includes("Authorization token")
        ) {
          setError(
            `Authentication token expired. Please click "Reconnect" to reestablish connection.`
          );
        }
      }
    } catch (err) {
      console.error("Failed to initialize topic client:", err);
      setError(
        `Failed to initialize chat: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setIsConnected(false);
    }
  };

  // Use a ref to track if the component has already been initialized
  const isInitialized = useRef(false);

  // Initialize the topic client when the component mounts or when user changes
  useEffect(() => {
    // Only initialize if we have a user and haven't initialized yet
    if (user && !isInitialized.current) {
      isInitialized.current = true; // Mark as initialized
      initTopicClient();
    }

    // Clean up subscription when component unmounts
    return () => {
      const currentClient = topicClientRef.current;

      if (currentClient) {
        try {
          // In newer versions, there is no explicit close method
          // The client will be garbage collected
          console.log("Component unmounting, subscription will be cleaned up");
        } catch (e) {
          console.error("Error cleaning up topic client:", e);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only depend on user to prevent unnecessary reinitializations

  const handleMessageReceived = (item: TopicItem) => {
    try {
      const value = item.value();
      // Check if value is a string or Uint8Array and handle accordingly
      const valueString =
        typeof value === "string" ? value : new TextDecoder().decode(value);

      const messageData = JSON.parse(valueString) as Message;

      // Skip messages that we've sent ourselves (already in our UI)
      if (sentMessageIds.current.has(messageData.id)) {
        console.log(`Skipping already displayed message: ${messageData.id}`);
        return;
      }

      setMessages((prevMessages) => [...prevMessages, messageData]);
    } catch (err) {
      console.error("Error processing incoming message:", err);
    }
  };

  const sendMessage = async () => {
    if (
      !newMessage.trim() ||
      !topicClientRef.current ||
      !isConnected ||
      !user
    ) {
      return;
    }

    try {
      const messageId = crypto.randomUUID();
      const messageData: Message = {
        id: messageId,
        author: user.username || "Anonymous",
        text: newMessage.trim(),
        timestamp: Date.now(),
      };

      // Add message to UI immediately
      setMessages((prevMessages) => [...prevMessages, messageData]);

      // Track the message ID to avoid duplication when we receive our own message
      sentMessageIds.current.add(messageId);

      // Set a timeout to remove the ID from tracking after a while
      // This prevents the set from growing indefinitely
      setTimeout(() => {
        sentMessageIds.current.delete(messageId);
      }, 30000); // Clean up after 30 seconds

      // Send message to the topic
      await topicClientRef.current.publish(
        "hackaton-main-chat-cache",
        "main-chat",
        JSON.stringify(messageData)
      );

      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(
        `Failed to send message: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg overflow-hidden transition-colors duration-300`}>
      <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-blue-600'} px-4 py-3 transition-colors duration-300`}>
        <h3 className="text-lg font-medium text-white">Main Chat</h3>
        <div className="flex justify-between items-center">
          <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-blue-100'}`}>
            {isConnected ? "Connected" : "Disconnected"}
          </div>
          {!isConnected && (
            <button
              onClick={() => {
                setError("Reconnecting to chat...");
                initTopicClient();
              }}
              className={`${isDarkMode 
                ? 'bg-gray-600 hover:bg-gray-500' 
                : 'bg-blue-700 hover:bg-blue-800'} 
                text-xs text-white px-2 py-1 rounded focus:outline-none focus:ring-1 
                ${isDarkMode ? 'focus:ring-gray-400' : 'focus:ring-blue-300'} 
                transition-colors duration-300`}
            >
              Reconnect
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className={`${isDarkMode 
          ? 'bg-red-900/20 border-red-700 text-red-300' 
          : 'bg-red-50 border-red-400 text-red-700'} 
          border-l-4 p-4 mb-2 transition-colors duration-300`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className={`h-5 w-5 ${isDarkMode ? 'text-red-500' : 'text-red-400'}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[500px] ${isDarkMode ? 'bg-gray-800' : 'bg-white'} transition-colors duration-300`}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className={`italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.author === (user?.username || "Anonymous")
                  ? "items-end"
                  : "items-start"
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] break-words ${
                  message.author === (user?.username || "Anonymous")
                    ? `${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white`
                    : `${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`
                } transition-colors duration-300`}
              >
                <div className={`text-xs mb-1 font-medium ${isDarkMode ? 'text-gray-300' : ''}`}>
                  {message.author === (user?.username || "Anonymous")
                    ? "You"
                    : message.author}
                </div>
                <p>{message.text}</p>
                <div className="text-xs mt-1 text-right opacity-70">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4 transition-colors duration-300`}>
        <div className="flex items-center">
          <textarea
            className={`flex-1 border rounded-l-md px-4 py-2 resize-none focus:outline-none focus:ring-2 
              ${isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'} 
              placeholder-gray-400 transition-colors duration-300`}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={!isConnected}
            rows={1}
          />
          <button
            className={`${isDarkMode 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-blue-600 hover:bg-blue-700'} 
              text-white px-4 py-2 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300`}
            onClick={sendMessage}
            disabled={!isConnected || !newMessage.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
