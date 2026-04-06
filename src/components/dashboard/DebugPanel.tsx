
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronUp, ChevronDown, Bug, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const DebugPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const { session, userRole } = useAuth();

  useEffect(() => {
    const addLog = (message: string) => {
      setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    // Log important state changes
    addLog(`Screen size: ${window.innerWidth}x${window.innerHeight}`);
    addLog(`User agent: ${navigator.userAgent}`);
    addLog(`Auth status: ${session ? 'Logged in' : 'Not logged in'}`);
    addLog(`User role: ${userRole || 'None'}`);
    addLog(`Current URL: ${window.location.pathname}`);

    const handleResize = () => {
      addLog(`Screen resized: ${window.innerWidth}x${window.innerHeight}`);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [session, userRole]);

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <Button
        variant="destructive"
        size="lg"
        className="shadow-xl border-4 border-destructive animate-pulse"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <AlertCircle className="mr-2 h-6 w-6" />
        Debug Panel {isExpanded ? <ChevronDown className="ml-2 h-6 w-6" /> : <ChevronUp className="ml-2 h-6 w-6" />}
      </Button>
      
      {isExpanded && (
        <Card className="absolute bottom-16 right-0 p-4 bg-background/95 backdrop-blur border-4 border-destructive shadow-xl w-96 max-h-[80vh] overflow-y-auto">
          <div className="space-y-2 text-sm font-mono">
            {logs.map((log, i) => (
              <div key={i} className="text-sm border-b border-border/20 pb-1">
                {log}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DebugPanel;

