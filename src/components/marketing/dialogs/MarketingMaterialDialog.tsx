
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MarketingMaterial } from "@/types/marketing.types";
import { MarketingMaterialForm } from "../form/MarketingMaterialForm";
import { useMarketingDialog } from "../hooks/useMarketingDialog";

interface MarketingMaterialDialogProps {
  material?: MarketingMaterial;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const MarketingMaterialDialog = ({
  material,
  open,
  onOpenChange,
  onSuccess,
}: MarketingMaterialDialogProps) => {
  const {
    formData,
    setFormData,
    handleSubmit
  } = useMarketingDialog(onSuccess);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {material ? "Edit Marketing Material" : "Add Marketing Material"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <MarketingMaterialForm 
            formData={formData}
            setFormData={setFormData}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
