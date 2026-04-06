
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ImportRecord } from "@/types/import.types";

export const LeadImportHistory = () => {
  const { data: imports, isLoading } = useQuery({
    queryKey: ["lead-imports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_imports')
        .select(`
          *,
          leads (
            id,
            name,
            email,
            phone,
            type,
            status
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ImportRecord[];
    }
  });

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('Leads')
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
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
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

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Import History</h3>
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </Card>
    );
  }

  return (
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
          {imports?.map((importItem) => (
            <TableRow key={importItem.id}>
              <TableCell>{format(new Date(importItem.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
              <TableCell className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {importItem.filename}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(importItem.status)}>
                  {importItem.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{importItem.total_rows}</TableCell>
              <TableCell className="text-right">{importItem.success_count}</TableCell>
              <TableCell className="text-right">{importItem.error_count}</TableCell>
              <TableCell>
                {importItem.file_path && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(importItem.file_path!, importItem.filename)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {(!imports || imports.length === 0) && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No import history found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
};
