import { useMutation } from "@tanstack/react-query";
import { createChannel } from "@/services/api";
import { CreateChannelInput, ChannelResponse } from "@/lib/validators";

export function useCreateChannel() {
  return useMutation<ChannelResponse, Error, CreateChannelInput>({
    mutationFn: createChannel,
    onError: (error) => {
      console.error("Failed to create channel:", error);
    },
  });
}
