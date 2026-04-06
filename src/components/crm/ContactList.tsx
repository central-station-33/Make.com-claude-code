import { Lead } from "@/types/lead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailLeadDialog } from "./EmailLeadDialog";

interface ContactListProps {
  contacts: Lead[];
}

const ContactList = ({ contacts }: ContactListProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Contacts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <h3 className="font-medium">{contact.name}</h3>
                <p className="text-sm text-gray-500">{contact.email}</p>
              </div>
              <EmailLeadDialog lead={contact} />
            </div>
          ))}
          {contacts.length === 0 && (
            <p className="text-center text-gray-500">No contacts found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactList;