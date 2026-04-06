import { Button } from "@/components/ui/button";

interface LeadFormHeaderProps {
  isSubmitting: boolean;
}

const LeadFormHeader = ({ isSubmitting }: LeadFormHeaderProps) => {
  return (
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? "Creating..." : "Create Lead"}
    </Button>
  );
};

export default LeadFormHeader;