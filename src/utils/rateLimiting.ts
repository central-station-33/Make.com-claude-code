export const RATE_LIMIT_MAX_ATTEMPTS = 5;
export const RATE_LIMIT_WINDOW_MINUTES = 15;

export const calculateTimeRemaining = (lastAttemptTime: string): number => {
  const lastAttempt = new Date(lastAttemptTime);
  const windowEnd = new Date(lastAttempt.getTime() + RATE_LIMIT_WINDOW_MINUTES * 60000);
  const remaining = windowEnd.getTime() - Date.now();
  return Math.max(0, Math.floor(remaining / 1000));
};

export const formatTimeRemaining = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};