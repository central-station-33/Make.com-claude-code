
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLeadImport } from "@/hooks/imports/useLeadImport";
import AgentSelect from "./assign/AgentSelect";
import { useAssignLead } from "./assign/useAssignLead";

interface LeadImportSectionProps {
  onSuccess: () => void;
}

export const LeadImportSection = ({ onSuccess }: LeadImportSectionProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const { toast } = useToast();
  const { isUploading, progress, handleFileUpload } = useLeadImport(onSuccess);
  const { agents } = useAssignLead("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    const allowedTypes = ['csv', 'xlsx', 'xls', 'numbers'];
    const fileType = selectedFile.name.split('.').pop()?.toLowerCase();
    
    if (!fileType || !allowedTypes.includes(fileType)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a CSV, Excel, or Numbers file"
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a file to import",
      });
      return;
    }

    try {
      await handleFileUpload(file);
      setFile(null);
      setSelectedAgent(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: "Failed to import leads. Please try again.",
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Import Leads</h3>
        <p className="text-sm text-muted-foreground">
          Upload a CSV, Excel, or Numbers file containing lead information. Optionally assign leads to an agent.
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".csv,.xlsx,.xls,.numbers"
              onChange={handleFileChange}
              className="flex-1"
            />
          </div>

          <AgentSelect
            agents={agents}
            selectedAgent={selectedAgent}
            onAgentChange={setSelectedAgent}
          />

          {isUploading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-500 text-center">
                Uploading...
              </p>
            </div>
          )}
          
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload Leads"}
          </Button>
        </div>
      </div>
    </Card>
  );
};
