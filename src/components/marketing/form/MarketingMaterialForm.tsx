
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MarketingMaterial } from "@/types/marketing.types";

interface MarketingMaterialFormProps {
  formData: {
    title: string;
    description: string;
    category: string;
    type: string;
    is_premium: boolean;
  };
  setFormData: (data: any) => void;
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
          value={formData.title}
          onChange={(e) =>
            setFormData((prev: any) => ({ ...prev, title: e.target.value }))
          }
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev: any) => ({ ...prev, description: e.target.value }))
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          value={formData.category}
          onChange={(e) =>
            setFormData((prev: any) => ({ ...prev, category: e.target.value }))
          }
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Input
          id="type"
          value={formData.type}
          onChange={(e) =>
            setFormData((prev: any) => ({ ...prev, type: e.target.value }))
          }
          required
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="is_premium">Premium Material</Label>
        <Switch
          id="is_premium"
          checked={formData.is_premium}
          onCheckedChange={(checked) =>
            setFormData((prev: any) => ({ ...prev, is_premium: checked }))
          }
        />
      </div>
    </div>
  );
};
