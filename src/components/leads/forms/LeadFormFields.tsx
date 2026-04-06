import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadType } from "@/types/lead";
import { LeadFormFieldsProps } from "@/types/lead";

const LeadFormFields = ({ register, errors, email, phone }: LeadFormFieldsProps) => {
  return (
    <>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          {...register("name", { required: "Name is required" })}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{String(errors.name.message)}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          defaultValue={email}
          {...register("email", {
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Invalid email address"
            }
          })}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{String(errors.email.message)}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          defaultValue={phone}
          {...register("phone", {
            pattern: {
              value: /^[0-9-+()]*$/,
              message: "Invalid phone number"
            }
          })}
          className={errors.phone ? "border-red-500" : ""}
        />
        {errors.phone && (
          <p className="text-red-500 text-sm mt-1">{String(errors.phone.message)}</p>
        )}
      </div>

      <div>
        <Label htmlFor="type">Type</Label>
        <Select
          onValueChange={(value) => register("type").onChange({ target: { value } })}
          defaultValue={LeadType.BUYER}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select lead type" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(LeadType).map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default LeadFormFields;