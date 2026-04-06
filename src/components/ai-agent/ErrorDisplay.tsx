
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ErrorDisplayProps {
  error: string;
  title?: string;
}

const ErrorDisplay = ({ error, title }: ErrorDisplayProps) => (
  <Card className="p-4 animate-in fade-in duration-300">
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  </Card>
);

export default ErrorDisplay;
