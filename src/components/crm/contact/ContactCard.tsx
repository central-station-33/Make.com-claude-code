import { User, Mail, Phone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CRMContact } from "@/types/crm.types";

interface ContactCardProps {
  contact: CRMContact;
}

export const ContactCard = ({ contact }: ContactCardProps) => {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <h3 className="font-medium">{contact.leads?.name || 'Unnamed Contact'}</h3>
          </div>
          <div className="mt-2 space-y-1 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{contact.leads?.email || 'No email'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{contact.leads?.phone || 'No phone'}</span>
            </div>
          </div>
          {contact.last_contacted && (
            <p className="text-sm text-gray-500 mt-2">
              Last contacted: {formatDistanceToNow(new Date(contact.last_contacted), { addSuffix: true })}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="capitalize">
            {contact.lifecycle_stage || 'New'}
          </Badge>
          {contact.next_follow_up && (
            <Badge variant="secondary" className="whitespace-nowrap">
              Follow-up: {formatDistanceToNow(new Date(contact.next_follow_up), { addSuffix: true })}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};