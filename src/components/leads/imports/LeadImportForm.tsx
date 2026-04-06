
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useChunkedImport } from "@/hooks/imports/useChunkedImport";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ImportStatus } from "@/types/import.types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LeadImportFormProps {
  onSuccess: () => void;
}

const LeadImportForm = ({ onSuccess }: LeadImportFormProps) => {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { 
    isProcessing, 
    progress,
    previewData,
    handleFileUpload,
    previewFile,
    importStatus 
  } = useChunkedImport(onSuccess);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    await previewFile(selectedFile);
  };

  const handleSubmit = async () => {
    if (!file) return;
    await handleFileUpload(file);
    setFile(null);
  };

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-6">
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                CSV, Excel, or Numbers files
              </p>
            </div>
            <input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls,.numbers"
              className="hidden"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
          </label>
        </div>

        {importStatus && (
          <div className="mt-4 p-4 bg-secondary rounded-lg">
            <h3 className="font-medium mb-2">Import Status</h3>
            <p>Status: {importStatus.status}</p>
            {importStatus.filename && <p>File: {importStatus.filename}</p>}
            {importStatus.processedRows !== undefined && (
              <p>Processed: {importStatus.processedRows} rows</p>
            )}
            {importStatus.successCount !== undefined && (
              <p>Successful: {importStatus.successCount} rows</p>
            )}
            {importStatus.errorCount !== undefined && (
              <p>Errors: {importStatus.errorCount} rows</p>
            )}
            {importStatus.error && (
              <p className="text-red-500">Error: {importStatus.error}</p>
            )}
          </div>
        )}

        {previewData.length > 0 && (
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Preview</h3>
            <div className="max-h-48 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(previewData[0]).map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index}>
                      {Object.values(row).map((value, i) => (
                        <TableCell key={i}>{value as string}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-500 text-center">
              Processing... {Math.round(progress)}%
            </p>
          </div>
        )}
        
        {file && !isProcessing && (
          <Button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full mt-4"
          >
            {isProcessing ? "Processing..." : "Import Leads"}
          </Button>
        )}
      </div>
    </ScrollArea>
  );
};

export default LeadImportForm;
