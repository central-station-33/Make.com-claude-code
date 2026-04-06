import { LeadWithProfile } from "@/types/dashboard";
import { Card } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, subDays } from "date-fns";

interface LeadAcquisitionChartProps {
  leads: LeadWithProfile[];
}

const LeadAcquisitionChart = ({ leads = [] }: LeadAcquisitionChartProps) => {
  console.log("Raw leads data:", leads);

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), i);
    return format(date, "MMM dd");
  }).reverse();

  const data = last30Days.map(date => {
    const count = Array.isArray(leads) 
      ? leads.filter(lead => 
          lead?.created_at && format(new Date(lead.created_at), "MMM dd") === date
        ).length
      : 0;
    return { date, count };
  });

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Lead Acquisition Trend</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#8884d8"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default LeadAcquisitionChart;