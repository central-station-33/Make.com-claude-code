import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Card } from "@/components/ui/card";

interface ContactStageChartProps {
  data: { name: string; value: number }[];
}

const ContactStageChart = ({ data }: ContactStageChartProps) => {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">
        Contact Stage Distribution
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#4f46e5" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default ContactStageChart;