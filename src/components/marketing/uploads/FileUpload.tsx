import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  required?: boolean;
}

export const FileUpload = ({ onFileChange, required = false }: FileUploadProps) => {
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split('.').pop()?.toLowerCase();
      const allowedTypes = ['pdf', 'ppt', 'pptx', 'doc', 'docx'];
      
      if (!allowedTypes.includes(fileType || '')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload only PDF, PPT, or DOC files.",
        });
        e.target.value = '';
        onFileChange(null);
        return;
      }
      onFileChange(selectedFile);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="file">File (PDF, PPT, or DOC)</Label>
      <Input
        id="file"
        type="file"
        accept=".pdf,.ppt,.pptx,.doc,.docx"
        onChange={handleFileChange}
        required={required}
      />
    </div>
  );
};