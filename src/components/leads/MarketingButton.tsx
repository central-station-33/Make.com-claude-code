import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { LeadType } from "@/types/lead";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface MarketingButtonProps {
  type: LeadType;
}

export const MarketingButton = ({ type }: MarketingButtonProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDownloadMaterials = () => {
    console.log(`Navigating to marketing materials for ${type} leads`);
    navigate('/marketing', { 
      state: { 
        leadType: type,
        defaultCategory: type
      } 
    });
    toast({
      title: `${type} Marketing Materials`,
      description: "Redirecting to relevant marketing materials...",
    });
  };

  return (
    <Button
      variant="outline"
      onClick={handleDownloadMaterials}
      className="flex items-center gap-2"
    >
      <FileDown className="w-4 h-4" />
      View {type} Marketing Materials
    </Button>
  );
};