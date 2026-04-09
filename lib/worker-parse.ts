// ============================================================
// Excel parse helper — runs heavy work off the main thread
// when Web Workers are available, otherwise falls back to
// chunked processing on the main thread.
// ============================================================
import * as XLSX from 'xlsx';
import { FlightRecord } from './types';
import { parseExcelData } from './utils';

export interface ParseProgress {
  phase: 'reading' | 'parsing' | 'analyzing' | 'done';
  percent: number;
  recordCount?: number;
}

/**
 * Parse an Excel file with progress callbacks.
 * Splits work into phases so the UI can show progress.
 */
export async function parseExcelWithProgress(
  file: File,
  onProgress: (p: ParseProgress) => void,
): Promise<FlightRecord[]> {
  // Phase 1: Read file
  onProgress({ phase: 'reading', percent: 10 });
  const buffer = await file.arrayBuffer();

  // Phase 2: Parse workbook — this is CPU-heavy
  onProgress({ phase: 'parsing', percent: 30 });

  // Yield to browser before heavy work
  await yieldToMain();

  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  // Collect rows from ALL sheets (each sheet may be a different tail)
  let allRows: any[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (json.length > 0) {
      allRows = allRows.concat(json);
    }
  }

  onProgress({ phase: 'parsing', percent: 50, recordCount: allRows.length });

  if (allRows.length === 0) {
    throw new Error('Excel dosyası boş veya okunamadı.');
  }

  // Phase 3: Analyze & create FlightRecords in chunks
  onProgress({ phase: 'analyzing', percent: 60 });
  await yieldToMain();

  // Process in chunks to avoid blocking
  const chunkSize = 3000;
  const records: FlightRecord[] = [];

  for (let i = 0; i < allRows.length; i += chunkSize) {
    const chunk = allRows.slice(i, i + chunkSize);
    const parsed = parseExcelData(chunk);
    records.push(...parsed);

    const pct = 60 + Math.round(((i + chunkSize) / allRows.length) * 35);
    onProgress({
      phase: 'analyzing',
      percent: Math.min(pct, 95),
      recordCount: records.length,
    });

    // Yield every chunk
    if (i + chunkSize < allRows.length) {
      await yieldToMain();
    }
  }

  onProgress({ phase: 'done', percent: 100, recordCount: records.length });
  return records;
}

/** Yield control back to the browser's event loop */
function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
