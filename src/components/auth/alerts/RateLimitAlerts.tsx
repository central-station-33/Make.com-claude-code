import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { formatTimeRemaining } from '@/utils/rateLimiting';

interface RateLimitAlertsProps {
  remainingAttempts: number;
  isRateLimited: boolean;
  timeRemaining: number;
}

export const RateLimitAlerts = ({
  remainingAttempts,
  isRateLimited,
  timeRemaining,
}: RateLimitAlertsProps) => {
  if (isRateLimited) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Account temporarily locked. Please try again in {formatTimeRemaining(timeRemaining)}
        </AlertDescription>
      </Alert>
    );
  }

  if (remainingAttempts < 3 && remainingAttempts > 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-700">
          Warning: {remainingAttempts} login {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};