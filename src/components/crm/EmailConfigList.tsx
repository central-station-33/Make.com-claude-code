import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface EmailConfig {
  id: string;
  email_address: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

const EmailConfigList = () => {
  const { data: configs, isLoading } = useQuery({
    queryKey: ['email-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_configurations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EmailConfig[];
    },
  });

  if (isLoading) return <div>Loading configurations...</div>;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Email Configurations</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email Address</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {configs?.map((config) => (
            <TableRow key={config.id}>
              <TableCell className="font-medium">{config.email_address}</TableCell>
              <TableCell>{config.description}</TableCell>
              <TableCell>
                <Badge variant={config.is_active ? 'default' : 'secondary'}>
                  {config.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(config.created_at), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default EmailConfigList;