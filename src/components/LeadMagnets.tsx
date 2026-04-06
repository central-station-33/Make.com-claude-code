import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { downloadContent, generateLeadMagnetContent } from "@/utils/leadMagnetContent";
import { supabase } from "@/integrations/supabase/client";
import LeadMagnetCard from "./lead-magnets/LeadMagnetCard";
import DownloadDialog from "./lead-magnets/DownloadDialog";
import { leadMagnets } from "./lead-magnets/leadMagnetData";

const LeadMagnets = () => {
  const { toast } = useToast();
  const [selectedMagnet, setSelectedMagnet] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const handleDownloadClick = (type: string) => {
    setSelectedMagnet(type);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMagnet) return;

    try {
      // Track the lead magnet interaction
      const { error: interactionError } = await supabase
        .from("lead_magnet_interactions")
        .insert({
          magnet_type: selectedMagnet,
          content_title: leadMagnets.find((m) => m.type === selectedMagnet)?.title,
          metadata: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          },
        });

      if (interactionError) throw interactionError;

      // Generate and download the content
      const { content, filename } = generateLeadMagnetContent(selectedMagnet);
      downloadContent(content, filename);

      toast({
        title: "Success!",
        description: "Your download should begin shortly.",
      });

      // Reset form and close dialog
      setFormData({ name: "", email: "", phone: "" });
      setSelectedMagnet(null);
    } catch (error) {
      console.error("Download error:", error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Please try again later.",
      });
    }
  };

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {leadMagnets.map((magnet) => (
          <LeadMagnetCard
            key={magnet.type}
            title={magnet.title}
            description={magnet.description}
            type={magnet.type}
            icon={magnet.icon}
            isLocked={magnet.isLocked}
            isTemplate={magnet.isTemplate}
            onDownload={() => handleDownloadClick(magnet.type)}
          />
        ))}
      </div>

      <DownloadDialog
        isOpen={!!selectedMagnet}
        onClose={() => setSelectedMagnet(null)}
        onOpenChange={(open) => !open && setSelectedMagnet(null)}
        selectedMagnet={selectedMagnet ? leadMagnets.find(m => m.type === selectedMagnet) || null : null}
        formData={formData}
        onFormChange={handleFormChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default LeadMagnets;