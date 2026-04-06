
import { Progress } from "@/components/ui/progress";

interface UploadProgressProps {
  progress: number;
}

export const UploadProgress = ({ progress }: UploadProgressProps) => {
  return (
    <div className="mt-4 space-y-2">
      <Progress value={progress} />
      <p className="text-sm text-muted-foreground text-center">
        Uploading... {Math.round(progress)}%
      </p>
    </div>
  );
};
