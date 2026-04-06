import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CustomizeTemplateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMagnet: {
    title: string;
    type: string;
  } | null;
  customContent: string;
  onContentChange: (content: string) => void;
  onSubmit: () => void;
}

const CustomizeTemplateDialog = ({
  isOpen,
  onOpenChange,
  selectedMagnet,
  customContent,
  onContentChange,
  onSubmit,
}: CustomizeTemplateDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>Customize {selectedMagnet?.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={customContent}
            onChange={(e) => onContentChange(e.target.value)}
            className="min-h-[300px] font-mono"
            placeholder="Customize your template content..."
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>
              Save & Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomizeTemplateDialog;