
import LeadImportForm from "./imports/LeadImportForm";

interface LeadListHeaderProps {
  onUploadSuccess: () => void;
}

export const LeadListHeader = ({ onUploadSuccess }: LeadListHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-semibold">Leads</h2>
      <div>
        <LeadImportForm onSuccess={onUploadSuccess} />
      </div>
    </div>
  );
};
