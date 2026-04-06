import { MessageSquare, Phone, Mail, Calendar } from "lucide-react";

interface ActivityIconProps {
  type: string;
}

export const ActivityIcon = ({ type }: ActivityIconProps) => {
  switch (type.toLowerCase()) {
    case 'call':
      return <Phone className="h-4 w-4" />;
    case 'email':
      return <Mail className="h-4 w-4" />;
    case 'meeting':
      return <Calendar className="h-4 w-4" />;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
};