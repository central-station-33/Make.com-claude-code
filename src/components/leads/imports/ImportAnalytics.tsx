
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";

interface ImportStats {
  total_imports: number;
  success_rate: number;
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  daily_stats: {
    date: string;
    imports: number;
    success_rate: number;
  }[];
}

export const ImportAnalytics = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["import-analytics"],
    queryFn: async () => {
      const { data: imports, error } = await supabase
        .from('lead_imports')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;

      // Calculate statistics
      const totalImports = imports.length;
      const totalRows = imports.reduce((sum, imp) => sum + (imp.total_rows || 0), 0);
      const successfulRows = imports.reduce((sum, imp) => sum + (imp.success_count || 0), 0);
      const failedRows = imports.reduce((sum, imp) => sum + (imp.error_count || 0), 0);
      const successRate = totalRows ? (successfulRows / totalRows) * 100 : 0;

      // Group by date for chart
      const dailyStats = imports.reduce((acc, imp) => {
        const date = new Date(imp.created_at).toLocaleDateString();
        const existing = acc.find(stat => stat.date === date);
        
        if (existing) {
          existing.imports += 1;
          existing.success_rate = ((existing.success_rate * (existing.imports - 1)) + 
            (imp.success_count / imp.total_rows * 100 || 0)) / existing.imports;
        } else {
          acc.push({
            date,
            imports: 1,
            success_rate: imp.success_count / imp.total_rows * 100 || 0
          });
        }
        
        return acc;
      }, [] as { date: string; imports: number; success_rate: number; }[]);

      return {
        total_imports: totalImports,
        success_rate: successRate,
        total_rows: totalRows,
        successful_rows: successfulRows,
        failed_rows: failedRows,
        daily_stats: dailyStats.slice(-7) // Last 7 days
      } as ImportStats;
    }
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Import Analytics</h3>
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Import Analytics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <h4 className="text-sm font-medium text-muted-foreground">Success Rate</h4>
          <p className="text-2xl font-bold">{stats.success_rate.toFixed(1)}%</p>
        </Card>
        <Card className="p-4">
          <h4 className="text-sm font-medium text-muted-foreground">Total Imports</h4>
          <p className="text-2xl font-bold">{stats.total_imports}</p>
        </Card>
        <Card className="p-4">
          <h4 className="text-sm font-medium text-muted-foreground">Total Rows</h4>
          <p className="text-2xl font-bold">{stats.total_rows}</p>
        </Card>
      </div>

      <div className="h-[300px]">
        <h4 className="text-sm font-medium text-muted-foreground mb-4">Daily Import Activity</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.daily_stats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Bar yAxisId="left" dataKey="imports" fill="#8884d8" name="Imports" />
            <Bar yAxisId="right" dataKey="success_rate" fill="#82ca9d" name="Success Rate (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
