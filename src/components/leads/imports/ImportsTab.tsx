
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import LeadImportForm from "./LeadImportForm";
import { ImportAnalytics } from "./ImportAnalytics";
import { ErrorRecoverySection } from "./ErrorRecoverySection";
import { useImportFiles } from "@/hooks/imports/useImportFiles";
import { FileText, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImportsTabProps {
  onSuccess?: () => void;
}

const ImportsTab = ({ onSuccess }: ImportsTabProps) => {
  const { data: files, isLoading } = useImportFiles();
  const { toast } = useToast();

  const getBadgeVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('leads-public')
        .download(filePath);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    }
  };

  return (
    <div className="space-y-8">
      <Card className="p-8 border-2 border-dashed">
        <LeadImportForm onSuccess={() => onSuccess?.()} />
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Import History</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Success</TableHead>
              <TableHead className="text-right">Errors</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files?.map((file) => (
              <TableRow key={file.id}>
                <TableCell>{format(new Date(file.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                <TableCell className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {file.filename}
                </TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(file.status)}>
                    {file.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{file.total_rows}</TableCell>
                <TableCell className="text-right">{file.success_count}</TableCell>
                <TableCell className="text-right">{file.error_count}</TableCell>
                <TableCell>
                  {file.file_path && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file.file_path!, file.filename)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && (!files || files.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No import history found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <ImportAnalytics />
      
      <ErrorRecoverySection />
    </div>
  );
};

export default ImportsTab;
