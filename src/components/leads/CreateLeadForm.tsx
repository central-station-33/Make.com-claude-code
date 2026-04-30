import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { LeadType } from "@/components/crm/types/lead";
import LeadFormHeader from "./forms/LeadFormHeader";
import LeadFormFields from "./forms/LeadFormFields";
import LeadSourceFields from "./LeadSourceFields";
import { getCurrentUser, signOut as firebaseSignOut } from "@/integrations/firebase/authHelpers";

interface CreateLeadFormProps {
  onSuccess?: () => void;
}

interface LeadFormData {
  name: string;
  email?: string;
  phone?: string;
  type: LeadType;
}

const CreateLeadForm = ({ onSuccess }: CreateLeadFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [source, setSource] = useState("");
  const [sourceDetails, setSourceDetails] = useState("");
  const [sourceReferralFee, setSourceReferralFee] = useState("");
  const [sourceReferralNotes, setSourceReferralNotes] = useState("");
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<LeadFormData>();
  
  const email = watch("email");
  const phone = watch("phone");

  const onSubmit = async (data: LeadFormData) => {
    if (!data.email?.trim() && !data.phone?.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Either email or phone is required"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('leads')
        .insert([{
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          type: data.type || LeadType.BUYER,
          status: 'New',
          user_id: getCurrentUser()?.uid,
          distribution_status: 'pending',
          // Only include source fields if they have values
          ...(source && { source }),
          ...(sourceDetails && { source_details: { details: sourceDetails } }),
          ...(sourceReferralFee && { source_referral_fee: parseFloat(sourceReferralFee) }),
          ...(sourceReferralNotes && { source_referral_notes: sourceReferralNotes }),
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead created successfully"
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error creating lead:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create lead"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <LeadFormFields
        register={register}
        errors={errors}
        email={email}
        phone={phone}
      />
      <LeadSourceFields 
        source={source}
        setSource={setSource}
        sourceDetails={sourceDetails}
        setSourceDetails={setSourceDetails}
        sourceReferralFee={sourceReferralFee}
        setSourceReferralFee={setSourceReferralFee}
        sourceReferralNotes={sourceReferralNotes}
        setSourceReferralNotes={setSourceReferralNotes}
      />
      <LeadFormHeader isSubmitting={isSubmitting} />
    </form>
  );
};

export default CreateLeadForm;