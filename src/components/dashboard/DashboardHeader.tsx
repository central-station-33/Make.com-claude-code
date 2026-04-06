
import React from 'react';
import InviteAgentDialog from "../agents/InviteAgentDialog";
import { useState } from "react";

const DashboardHeader = ({ onRefresh }: { onRefresh: () => void }) => {
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white animate-fade-in">
          JRA Central Station
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your leads and agent onboarding
        </p>
      </div>
      <div className="flex items-center gap-4">
        <InviteAgentDialog 
          open={isInviteOpen}
          onOpenChange={setIsInviteOpen}
        />
      </div>
    </div>
  );
};

export default DashboardHeader;
