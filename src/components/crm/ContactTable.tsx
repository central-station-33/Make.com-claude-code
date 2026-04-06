import { formatDistanceToNow } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Contact {
  id: string;
  leads?: {
    name: string;
    email: string;
  };
  status: string;
  lifecycle_stage?: string;
  last_contacted?: string;
  next_follow_up?: string;
}

interface ContactTableProps {
  contacts: Contact[];
}

const ContactTable = ({ contacts }: ContactTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead>Last Contact</TableHead>
          <TableHead>Next Follow-up</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts?.map((contact) => (
          <TableRow key={contact.id}>
            <TableCell className="font-medium">
              {contact.leads?.name}
              <div className="text-sm text-gray-500">
                {contact.leads?.email}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={contact.status === 'active' ? 'default' : 'secondary'}>
                {contact.status}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {contact.lifecycle_stage || 'New'}
              </Badge>
            </TableCell>
            <TableCell>
              {contact.last_contacted ? 
                formatDistanceToNow(new Date(contact.last_contacted), { addSuffix: true }) :
                'Never'
              }
            </TableCell>
            <TableCell>
              {contact.next_follow_up ?
                formatDistanceToNow(new Date(contact.next_follow_up), { addSuffix: true }) :
                'Not scheduled'
              }
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ContactTable;