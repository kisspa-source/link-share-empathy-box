import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { PostgrestBuilder } from "@supabase/postgrest-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Fetch helper with timeout support
export async function fetchWithTimeout<T>(
  promise: Promise<T> | PostgrestBuilder<any, any>,
  timeoutMs: number
): Promise<T | null> {
  const timeout = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } catch (error: any) {
    if (error.message && error.message.includes("timed out")) {
      console.warn("Operation timed out, using fallback data");
      return null;
    }
    throw error;
  }
}

// Unified error handler
export function handleError(error: unknown, context = "") {
  console.error(`Error in ${context}:`, error);
  const message =
    (typeof error === "string" && error) ||
    (error as any)?.message ||
    (error as any)?.error_description ||
    (error as any)?.error ||
    "알 수 없는 오류가 발생했습니다.";
  toast.error(message);
  return { error, message };
}
