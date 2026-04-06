import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PriceInfoProps {
  price: number | null;
  priceChange: number;
  trend: 'increase' | 'decrease' | null;
}

export const PriceInfo = ({ price, priceChange, trend }: PriceInfoProps) => {
  return (
    <div className="flex justify-between items-start mb-2">
      <h3 className="font-semibold text-lg">
        {price ? formatCurrency(price) : 'Price not available'}
      </h3>
      {trend && (
        <Badge variant={trend === 'decrease' ? 'destructive' : 'default'}>
          {trend === 'decrease' ? (
            <TrendingDown className="h-4 w-4 mr-1" />
          ) : (
            <TrendingUp className="h-4 w-4 mr-1" />
          )}
          {Math.abs(priceChange).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
          })}
        </Badge>
      )}
    </div>
  );
};