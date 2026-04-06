import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { TemplateSelect } from "./TemplateSelect";
import { DateSelect } from "./DateSelect";

interface SchedulerFormProps {
  onSubmit: (templateId: string, date: Date) => void;
  isSubmitting: boolean;
  error: string | null;
}

export const SchedulerForm = ({ onSubmit, isSubmitting, error }: SchedulerFormProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = () => {
    setValidationError(null);

    if (!selectedTemplate) {
      setValidationError("Please select a template");
      return;
    }

    if (!selectedDate) {
      setValidationError("Please select a date");
      return;
    }

    onSubmit(selectedTemplate, selectedDate);
  };

  return (
    <div className="space-y-4">
      {(error || validationError) && (
        <Alert variant="destructive">
          <AlertDescription>{error || validationError}</AlertDescription>
        </Alert>
      )}
      
      <TemplateSelect
        selectedTemplate={selectedTemplate}
        onTemplateChange={(value) => {
          setValidationError(null);
          setSelectedTemplate(value);
        }}
      />
      
      <DateSelect
        selectedDate={selectedDate}
        onDateSelect={(date) => {
          setValidationError(null);
          setSelectedDate(date);
        }}
      />
      
      <Button
        onClick={handleSubmit}
        disabled={!selectedTemplate || !selectedDate || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Scheduling...
          </>
        ) : (
          "Schedule Follow-up"
        )}
      </Button>
    </div>
  );
};