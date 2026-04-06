
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MarketingMaterial } from "@/types/marketing.types";

interface MarketingMaterialFormProps {
  formData: Partial<MarketingMaterial>;
  setFormData: (data: Partial<MarketingMaterial>) => void;
}

export const MarketingMaterialForm = ({
  formData,
  setFormData,
}: MarketingMaterialFormProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title || ""}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ""}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          value={formData.category || ""}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value })
          }
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Input
          id="type"
          value={formData.type || "document"}
          onChange={(e) =>
            setFormData({ ...formData, type: e.target.value })
          }
          required
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="is_premium">Premium Material</Label>
        <Switch
          id="is_premium"
          checked={formData.is_premium || false}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, is_premium: checked })
          }
        />
      </div>
    </div>
  );
};
