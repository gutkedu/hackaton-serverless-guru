import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * A utility function that combines clsx and tailwind-merge
 * for conditional and merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to a more readable format
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(typeof date === "string" ? new Date(date) : date);
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
