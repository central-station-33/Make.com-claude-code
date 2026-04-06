
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface LogoUploadProps {
  onLogoChange: (file: File | null) => void;
  currentLogoUrl?: string;
}

export const LogoUpload = ({ onLogoChange, currentLogoUrl }: LogoUploadProps) => {
  const { toast } = useToast();

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!['png', 'jpg', 'jpeg', 'svg'].includes(fileType || '')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload only PNG, JPG, JPEG, or SVG files for the logo.",
        });
        return;
      }
      onLogoChange(selectedFile);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="logo">Brand Logo (PNG, JPG, JPEG, or SVG)</Label>
      <Input
        id="logo"
        type="file"
        accept=".png,.jpg,.jpeg,.svg"
        onChange={handleLogoChange}
      />
      {currentLogoUrl && (
        <div className="mt-2">
          <Label>Current Logo</Label>
          <div className="mt-1">
            <img
              src={currentLogoUrl}
              alt="Brand Logo"
              className="h-20 w-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
