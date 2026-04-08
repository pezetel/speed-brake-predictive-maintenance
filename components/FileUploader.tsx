'use client';

import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { FlightRecord } from '@/lib/types';
import { parseExcelData } from '@/lib/utils';

interface Props {
  onDataLoaded: (data: FlightRecord[]) => void;
}

export default function FileUploader({ onDataLoaded }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (json.length === 0) {
        setError('Excel dosyası boş veya okunamadı.');
        setIsLoading(false);
        return;
      }

      const records = parseExcelData(json);

      if (records.length === 0) {
        setError('Geçerli uçuş kaydı bulunamadı. Kolon sıralamasını kontrol edin.');
        setIsLoading(false);
        return;
      }

      setTimeout(() => {
        onDataLoaded(records);
        setIsLoading(false);
      }, 500);
    } catch (err) {
      setError('Dosya okunurken hata oluştu: ' + (err as Error).message);
      setIsLoading(false);
    }
  }, [onDataLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-10 transition-all duration-300 cursor-pointer
          ${isDragging
            ? 'border-blue-400 bg-blue-500/10 scale-[1.02]'
            : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50'
          }
          ${isLoading ? 'pointer-events-none opacity-60' : ''}
        `}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileInput}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
            <p className="text-slate-300 font-medium">Dosya işleniyor...</p>
            {fileName && <p className="text-slate-500 text-sm">{fileName}</p>}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-slate-700/50 rounded-xl">
              {isDragging ? (
                <FileSpreadsheet className="w-12 h-12 text-blue-400" />
              ) : (
                <Upload className="w-12 h-12 text-slate-400" />
              )}
            </div>
            <div className="text-center">
              <p className="text-slate-300 font-medium">
                {isDragging ? 'Dosyayı bırakın' : 'Excel dosyanızı sürükleyin veya tıklayın'}
              </p>
              <p className="text-slate-500 text-sm mt-1">.xlsx, .xls, .csv desteklenir</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
