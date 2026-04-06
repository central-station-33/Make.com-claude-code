import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MaterialCardHeaderProps {
  title: string;
  description: string;
  isPremium: boolean;
  category: string;
}

export const MaterialCardHeader = ({ 
  title, 
  description, 
  isPremium, 
  category 
}: MaterialCardHeaderProps) => {
  return (
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {isPremium && (
          <Badge variant="secondary">Premium</Badge>
        )}
      </div>
      <Badge variant="outline">{category}</Badge>
    </CardHeader>
  );
};