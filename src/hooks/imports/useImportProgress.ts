
import { useState } from 'react';
import { ImportStatus } from '@/types/import.types';

export const useImportProgress = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [totalRows, setTotalRows] = useState(0);

  const updateProgress = (processed: number) => {
    const newProgress = totalRows > 0 ? (processed / totalRows) * 100 : 0;
    setProgress(Math.min(newProgress, 100));
  };

  return {
    isProcessing,
    setIsProcessing,
    progress,
    setProgress: updateProgress,
    importStatus,
    setImportStatus,
    totalRows,
    setTotalRows,
  };
};
