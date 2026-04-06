import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface PriceHistoryProps {
  history: any[];
}

const PriceHistory = ({ history }: PriceHistoryProps) => {
  if (!history || history.length === 0) return null;

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="text-sm font-semibold mb-2">Price History</h4>
      <div className="space-y-2">
        {history
          .sort((a, b) => new Date(b.list_date).getTime() - new Date(a.list_date).getTime())
          .map((record, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{format(new Date(record.list_date), 'MMM d, yyyy')}</span>
              <span className={record.price_change < 0 ? 'text-red-600' : 'text-green-600'}>
                {formatCurrency(record.list_price)}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default PriceHistory;