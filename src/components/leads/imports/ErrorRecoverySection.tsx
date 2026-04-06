
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, ArrowUpCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useChunkProcessing } from "@/hooks/imports/useChunkProcessing";

export const ErrorRecoverySection = () => {
  const [isRetrying, setIsRetrying] = useState(false);
  const { toast } = useToast();
  const { processChunk } = useChunkProcessing();

  const { data: failedImports, isLoading, refetch } = useQuery({
    queryKey: ['failed-imports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_imports')
        .select('*')
        .eq('status', 'completed')
        .gt('error_count', 0)
        .eq('can_retry', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const handleRetry = async (importId: string, retryableRows: any[]) => {
    setIsRetrying(true);
    try {
      const { successCount, errorCount } = await processChunk(
        importId,
        0, // Retry chunk always starts at 0
        retryableRows
      );

      // Update import record
      await supabase
        .from('lead_imports')
        .update({
          success_count: successCount,
          error_count: errorCount,
          retryable_rows: [], // Clear retryable rows
          can_retry: false
        })
        .eq('id', importId);

      toast({
        title: "Retry Complete",
        description: `Successfully processed ${successCount} rows with ${errorCount} errors.`,
      });

      refetch();
    } catch (error) {
      console.error('Retry error:', error);
      toast({
        variant: "destructive",
        title: "Retry Failed",
        description: error instanceof Error ? error.message : "Failed to retry import",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  if (isLoading) return null;
  if (!failedImports?.length) return null;

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Failed Imports</h3>
      
      <div className="space-y-4">
        {failedImports.map((importRecord) => {
          // Safely handle retryable_rows as it might be a JSON value
          const retryableRows = Array.isArray(importRecord.retryable_rows) 
            ? importRecord.retryable_rows 
            : [];

          return (
            <Alert key={importRecord.id}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Import with Errors</AlertTitle>
              <AlertDescription className="mt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p>File: {importRecord.filename}</p>
                    <p className="text-sm text-muted-foreground">
                      {retryableRows.length} rows can be retried
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRetry(importRecord.id, retryableRows)}
                    disabled={isRetrying}
                  >
                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                    {isRetrying ? "Retrying..." : "Retry Failed Rows"}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          );
        })}
      </div>
    </Card>
  );
};
