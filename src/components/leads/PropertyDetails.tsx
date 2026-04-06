import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PropertyDetailsProps {
  propertyType: string;
  setPropertyType: (value: string) => void;
  budget: string;
  setBudget: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
}

const PropertyDetails = ({
  propertyType, setPropertyType,
  budget, setBudget,
  location, setLocation,
  notes, setNotes
}: PropertyDetailsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="propertyType">Property Type</Label>
        <Input
          id="propertyType"
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget">Budget</Label>
        <Input
          id="budget"
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
        />
      </div>
    </>
  );
};

export default PropertyDetails;