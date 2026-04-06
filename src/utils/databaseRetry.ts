
import { PostgrestError } from '@supabase/supabase-js';

const RETRY_COUNT = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  onRetry?: (attempt: number, error: any) => void;
}

export async function withDatabaseRetry<T>(
  operation: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: PostgrestError | null }> {
  const maxAttempts = options.maxAttempts || RETRY_COUNT;
  const initialDelay = options.initialDelay || INITIAL_RETRY_DELAY;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await operation();
      
      // If there's no error or it's not a lock-related error, return immediately
      if (!result.error || !isLockError(result.error)) {
        return result;
      }

      // If this was the last attempt, return the error
      if (attempt === maxAttempts) {
        console.error(`All ${maxAttempts} attempts failed:`, result.error);
        return result;
      }

      // Calculate exponential backoff delay
      const delay = initialDelay * Math.pow(2, attempt - 1);
      
      // Log retry attempt
      console.log(`Database operation failed (attempt ${attempt}/${maxAttempts}). Retrying in ${delay}ms...`);
      options.onRetry?.(attempt, result.error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (error) {
      // If this was the last attempt, return the error
      if (attempt === maxAttempts) {
        console.error(`All ${maxAttempts} attempts failed with unexpected error:`, error);
        return { data: null, error: error as PostgrestError };
      }
      
      // Log retry attempt for unexpected errors
      console.log(`Unexpected error (attempt ${attempt}/${maxAttempts}). Retrying...`);
      options.onRetry?.(attempt, error);
      
      // Wait before retrying
      const delay = initialDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached due to the returns above, but TypeScript needs it
  return { data: null, error: null };
}

function isLockError(error: PostgrestError): boolean {
  // Check for common lock-related error codes
  const lockErrorCodes = ['55P03', '40P01', '40001', '40002'];
  return lockErrorCodes.includes(error.code) || 
         error.message.toLowerCase().includes('lock') ||
         error.message.toLowerCase().includes('deadlock');
}
