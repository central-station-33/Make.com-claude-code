
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MarketingMaterial } from "@/types/marketing.types";
import { MarketingMaterialForm } from "./form/MarketingMaterialForm";
import { FileUpload } from "./uploads/FileUpload";
import { LogoUpload } from "./uploads/LogoUpload";

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
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: material?.title || "",
    description: material?.description || "",
    category: material?.category || "",
    type: material?.type || "document",
    is_premium: material?.is_premium || false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      if (material?.id) {
        const { error } = await supabase
          .from("marketing_materials")
          .update(formData)
          .eq("id", material.id);

        if (error) throw error;

        if (logo) {
          const formDataWithLogo = new FormData();
          formDataWithLogo.append('logo', logo);
          formDataWithLogo.append('materialId', material.id);

          const { error: logoError } = await supabase.functions.invoke('upload-brand-logo', {
            body: formDataWithLogo
          });

          if (logoError) throw logoError;
        }

        toast({
          title: "Material Updated",
          description: "The marketing material has been updated successfully.",
        });
      } else {
        if (!file) {
          toast({
            variant: "destructive",
            title: "File Required",
            description: "Please select a file to upload.",
          });
          return;
        }

        const formDataToUpload = new FormData();
        formDataToUpload.append('file', file);
        formDataToUpload.append('title', formData.title);
        formDataToUpload.append('description', formData.description);
        formDataToUpload.append('category', formData.category);
        formDataToUpload.append('type', formData.type);
        formDataToUpload.append('is_premium', formData.is_premium.toString());

        const { error } = await supabase.functions.invoke('upload-marketing-material', {
          body: formDataToUpload
        });

        if (error) throw error;

        if (logo) {
          const formDataWithLogo = new FormData();
          formDataWithLogo.append('logo', logo);

          const { error: logoError } = await supabase.functions.invoke('upload-brand-logo', {
            body: formDataWithLogo
          });

          if (logoError) throw logoError;
        }

        toast({
          title: "Material Created",
          description: "The new marketing material has been created successfully.",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving material:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save the marketing material.",
      });
    } finally {
      setIsUploading(false);
    }
  };

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
          {!material && (
            <FileUpload
              onFileChange={setFile}
              required
            />
          )}
          <LogoUpload
            onLogoChange={setLogo}
            currentLogoUrl={material?.brand_logo_url}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MarketingMaterialDialog;
