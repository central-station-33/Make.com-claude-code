import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const HomeDidntSell = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConsultationRequest = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Please sign in",
          description: "You need to be signed in to request a consultation.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase.from('leads').insert({
        name: user.user_metadata?.full_name || 'Anonymous',
        email: user.email,
        type: 'consultation',
        source: 'home_didnt_sell',
        status: 'New',
        user_id: user.id,
        source_details: { page: 'home_didnt_sell' }
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "We'll contact you shortly to schedule your free consultation.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem submitting your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        Did Your Home Not Sell?
      </h1>
      
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Common Reasons Homes Don't Sell</h2>
          <ul className="space-y-3">
            <li>• Pricing strategy needs adjustment</li>
            <li>• Marketing wasn't reaching the right buyers</li>
            <li>• Property condition or presentation issues</li>
            <li>• Market timing or conditions</li>
            <li>• Location challenges</li>
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Our Solution</h2>
          <ul className="space-y-3">
            <li>• Professional market analysis</li>
            <li>• Custom marketing strategy</li>
            <li>• Property enhancement recommendations</li>
            <li>• Targeted buyer outreach</li>
            <li>• Expert negotiation support</li>
          </ul>
        </Card>
      </div>

      <Card className="max-w-2xl mx-auto p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Get Your Free Consultation</h2>
        <p className="mb-6 text-gray-600">
          Let our experts analyze why your home didn't sell and create a custom strategy for success.
        </p>
        <Button 
          size="lg" 
          onClick={handleConsultationRequest}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Request Free Consultation"}
        </Button>
      </Card>
    </div>
  );
};

export default HomeDidntSell;