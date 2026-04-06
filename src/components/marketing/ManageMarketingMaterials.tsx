import { Button } from "@/components/ui/button";
import { Plus, Download, Upload } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MaterialGrid } from "./MaterialGrid";
import { MarketingMaterialDialog } from "./dialogs/MarketingMaterialDialog";
import { useMarketingDialog } from "./hooks/useMarketingDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

export const ManageMarketingMaterials = () => {
  const { toast } = useToast();
  const { data: materials, refetch } = useQuery({
    queryKey: ["marketingMaterials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_materials")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const {
    open,
    selectedMaterial,
    handleOpenChange,
    handleEdit,
    handleDelete,
  } = useMarketingDialog(refetch);

  const handleExport = async () => {
    if (!materials?.length) {
      toast({
        title: "No materials to export",
        description: "There are no marketing materials to export.",
        variant: "destructive",
      });
      return;
    }

    const csvContent = materials.map(material => ({
      title: material.title,
      description: material.description,
      category: material.category,
      type: material.type,
      is_premium: material.is_premium ? "Yes" : "No"
    }));

    const csv = [
      Object.keys(csvContent[0]).join(','),
      ...csvContent.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'marketing-materials.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "Export Successful",
      description: "Marketing materials have been exported successfully.",
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n');
        const headers = rows[0].split(',');
        
        const materials = rows.slice(1).map(row => {
          const values = row.split(',');
          const material: any = {};
          headers.forEach((header, index) => {
            material[header.trim()] = values[index]?.trim();
          });
          return material;
        });

        // Insert materials into database
        const { error } = await supabase
          .from('marketing_materials')
          .insert(materials);

        if (error) throw error;

        toast({
          title: "Import Successful",
          description: `${materials.length} marketing materials have been imported.`,
        });

        refetch();
      } catch (error) {
        console.error('Import error:', error);
        toast({
          title: "Import Failed",
          description: "There was an error importing the marketing materials.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Marketing Materials</h2>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenChange(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Material
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button variant="outline" className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Materials</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="premium">Premium</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {materials && (
            <MaterialGrid
              materials={materials}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </TabsContent>

        <TabsContent value="documents">
          {materials && (
            <MaterialGrid
              materials={materials.filter(m => m.type === 'document')}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </TabsContent>

        <TabsContent value="templates">
          {materials && (
            <MaterialGrid
              materials={materials.filter(m => m.type === 'template')}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </TabsContent>

        <TabsContent value="premium">
          {materials && (
            <MaterialGrid
              materials={materials.filter(m => m.is_premium)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </TabsContent>
      </Tabs>

      <MarketingMaterialDialog
        material={selectedMaterial}
        open={open}
        onOpenChange={handleOpenChange}
        onSuccess={refetch}
      />
    </div>
  );
};