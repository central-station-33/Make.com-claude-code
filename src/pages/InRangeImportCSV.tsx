import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { inrange } from '@/integrations/supabase/inrange';
import { ArrowLeft, Upload, FileText, AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';

type CSVRow = {
  address: string;
  city: string;
  state: string;
  zip: string;
  owner_name?: string;
  deal_type?: string;
};

function parseCSV(text: string): CSVRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[^a-z_]/g, '_'));
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = cols[idx] ?? ''; });

    const address = obj['address'] || obj['property_address'] || obj['street_address'] || '';
    const city = obj['city'] || '';
    const state = obj['state'] || '';
    const zip = obj['zip'] || obj['zip_code'] || obj['postal_code'] || '';

    if (address && city) {
      rows.push({
        address,
        city,
        state: state || 'NJ',
        zip,
        owner_name: obj['owner_name'] || obj['owner'] || undefined,
        deal_type: obj['deal_type'] || undefined,
      });
    }
  }

  return rows;
}

export default function InRangeImportCSV() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CSVRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');

  const importRows = useMutation({
    mutationFn: async () => {
      const payload = rows.map((r) => ({
        address: r.address,
        city: r.city,
        state: r.state,
        zip: r.zip,
        owner_name: r.owner_name || null,
        deal_type: r.deal_type || null,
        composite_score: 50,
        priority_tier: 'Tier 3',
        enrichment_status: 'pending',
        status: 'new_lead',
      }));

      const { error } = await inrange.from('properties').insert(payload as any);
      if (error) throw error;
    },
    onSuccess: () => {
      setTimeout(() => navigate('/inrange/leads'), 1200);
    },
  });

  const handleFile = (file: File) => {
    setParseError('');
    setRows([]);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setParseError('No valid rows found. Make sure your CSV has "address" and "city" columns.');
        } else {
          setRows(parsed);
        }
      } catch {
        setParseError('Could not parse the CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/inrange')} className="text-gray-500 dark:text-gray-400 p-1 -ml-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1">Import from CSV</h1>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Format hint */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Expected columns</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">
            address, city, state, zip, owner_name, deal_type
          </p>
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">Only <strong>address</strong> and <strong>city</strong> are required.</p>
        </div>

        {/* Drop zone */}
        {rows.length === 0 && (
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          >
            <Upload className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Drop CSV here or tap to browse</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Accepts .csv files</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
          </div>
        )}

        {/* Parse error */}
        {parseError && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{parseError}</p>
          </div>
        )}

        {/* Preview */}
        {rows.length > 0 && !importRows.isSuccess && (
          <>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1 truncate">{fileName}</p>
              <button
                onClick={() => { setRows([]); setFileName(''); }}
                className="text-gray-400 dark:text-gray-500 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{rows.length} lead{rows.length !== 1 ? 's' : ''} ready to import</p>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
                {rows.slice(0, 50).map((r, i) => (
                  <div key={i} className="px-4 py-2.5">
                    <p className="text-sm text-gray-900 dark:text-white font-medium truncate">{r.address}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {r.city}, {r.state} {r.zip}
                      {r.owner_name ? ` · ${r.owner_name}` : ''}
                    </p>
                  </div>
                ))}
                {rows.length > 50 && (
                  <div className="px-4 py-2 text-center">
                    <p className="text-xs text-gray-400">…and {rows.length - 50} more</p>
                  </div>
                )}
              </div>
            </div>

            {importRows.error && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                <p className="text-sm text-red-700 dark:text-red-300">{(importRows.error as Error).message}</p>
              </div>
            )}

            <button
              onClick={() => importRows.mutate()}
              disabled={importRows.isPending}
              className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {importRows.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Import {rows.length} Lead{rows.length !== 1 ? 's' : ''}
            </button>
          </>
        )}

        {/* Success */}
        {importRows.isSuccess && (
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-base font-semibold text-gray-900 dark:text-white">Import complete!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Redirecting to your leads…</p>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
