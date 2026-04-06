import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface TemplateSelectProps {
  selectedTemplate: string;
  onTemplateChange: (value: string) => void;
}

export const TemplateSelect = ({ selectedTemplate, onTemplateChange }: TemplateSelectProps) => {
  const { toast } = useToast();

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['followUpTemplates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follow_up_templates')
        .select('*')
        .eq('is_active', true)
        .order('day_number', { ascending: true });

      if (error) {
        toast({
          title: "Error loading templates",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      return data;
    },
  });

  if (templatesLoading) {
    return <div>Loading templates...</div>;
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Template</label>
      <Select
        value={selectedTemplate}
        onValueChange={onTemplateChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a template" />
        </SelectTrigger>
        <SelectContent>
          {templates?.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              {template.name} (Day {template.day_number})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};