interface ActivityContactInfoProps {
  contact: {
    name: string | null;
    profiles?: {
      full_name: string | null;
    } | null;
    source?: string | null;
    source_details?: Record<string, any> | null;
  } | null;
}

export const ActivityContactInfo = ({ contact }: ActivityContactInfoProps) => {
  if (!contact?.name) return null;

  return (
    <p className="text-sm text-gray-500 mt-2">
      Contact: {contact.name}
      {contact.profiles?.full_name && (
        <span> (Agent: {contact.profiles.full_name})</span>
      )}
      {contact.source && (
        <span className="block">
          Source: {contact.source}
          {contact.source_details && (
            <span> - {JSON.stringify(contact.source_details)}</span>
          )}
        </span>
      )}
    </p>
  );
};