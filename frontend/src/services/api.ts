import axios from "axios";
import { z } from "zod";
import { CreateChannelInput, channelResponseSchema } from "@/lib/validators";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://62j8h4cqs5.execute-api.us-east-1.amazonaws.com/dev";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function createChannel(data: CreateChannelInput) {
  const response = await api.post("/channel/create", data);
  return channelResponseSchema.parse(response.data);
}

export async function parseData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
    }
    throw error;
  }
}
