import { Card, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface PerformanceChartProps {
  data: Array<{
    date: string;
    views: number;
    conversions: number;
  }>;
}

export const PerformanceChart = ({ data }: PerformanceChartProps) => {
  return (
    <Card className="p-6">
      <CardTitle className="mb-4">Performance Overview</CardTitle>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="views" stroke="#8884d8" />
            <Line type="monotone" dataKey="conversions" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};