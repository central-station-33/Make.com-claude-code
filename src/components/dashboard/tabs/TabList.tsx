
import { FC } from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

const TabList: FC = () => {
  return (
    <TabsList className="hidden">
      <TabsTrigger value="leads">Lead List</TabsTrigger>
      <TabsTrigger value="import">Import</TabsTrigger>
    </TabsList>
  );
};

export default TabList;
