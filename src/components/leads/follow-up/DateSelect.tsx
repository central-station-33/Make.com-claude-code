import { Calendar } from "@/components/ui/calendar";

interface DateSelectProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
}

export const DateSelect = ({ selectedDate, onDateSelect }: DateSelectProps) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">Date</label>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        className="rounded-md border"
        disabled={(date) => date < new Date()}
      />
    </div>
  );
};