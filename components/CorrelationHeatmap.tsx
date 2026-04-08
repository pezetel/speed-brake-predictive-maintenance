'use client';

import { useMemo } from 'react';
import { FlightRecord } from '@/lib/types';
import { computeCorrelation, numericFields, getFieldLabel } from '@/lib/utils';

interface Props {
  data: FlightRecord[];
  fullSize?: boolean;
}

export default function CorrelationHeatmap({ data, fullSize }: Props) {
  const matrix = useMemo(() => {
    const fields = [...numericFields];
    const result: { xKey: string; yKey: string; value: number }[][] = [];

    for (let i = 0; i < fields.length; i++) {
      const row: { xKey: string; yKey: string; value: number }[] = [];
      for (let j = 0; j < fields.length; j++) {
        const xVals = data.map(d => d[fields[i] as keyof FlightRecord] as number).filter(v => typeof v === 'number' && v > 0 && v < 100000);
        const yVals = data.map(d => d[fields[j] as keyof FlightRecord] as number).filter(v => typeof v === 'number' && v > 0 && v < 100000);
        const minLen = Math.min(xVals.length, yVals.length);
        const corr = computeCorrelation(xVals.slice(0, minLen), yVals.slice(0, minLen));
        row.push({ xKey: fields[i], yKey: fields[j], value: corr });
      }
      result.push(row);
    }
    return result;
  }, [data]);

  const getColor = (val: number): string => {
    const abs = Math.abs(val);
    if (val > 0) {
      if (abs > 0.8) return 'bg-blue-500 text-white';
      if (abs > 0.6) return 'bg-blue-400/80 text-white';
      if (abs > 0.4) return 'bg-blue-300/60 text-blue-100';
      if (abs > 0.2) return 'bg-blue-200/30 text-blue-200';
      return 'bg-slate-700/50 text-slate-400';
    } else {
      if (abs > 0.8) return 'bg-red-500 text-white';
      if (abs > 0.6) return 'bg-red-400/80 text-white';
      if (abs > 0.4) return 'bg-red-300/60 text-red-100';
      if (abs > 0.2) return 'bg-red-200/30 text-red-200';
      return 'bg-slate-700/50 text-slate-400';
    }
  };

  const fields = [...numericFields];

  return (
    <div className={`card ${fullSize ? '' : ''}`}>
      <div className="card-header flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 via-slate-500 to-blue-500" />
        Korelasyon Matrisi
      </div>
      <div className="overflow-x-auto">
        <div className={`${fullSize ? 'min-w-[800px]' : 'min-w-[600px]'}`}>
          {/* Header */}
          <div className="flex">
            <div className={`${fullSize ? 'w-36' : 'w-28'} shrink-0`} />
            {fields.map(f => (
              <div
                key={f}
                className={`${fullSize ? 'w-24' : 'w-16'} shrink-0 text-center`}
              >
                <span className="text-[10px] text-slate-400 font-medium leading-tight block" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', height: fullSize ? '100px' : '70px' }}>
                  {getFieldLabel(f)}
                </span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {matrix.map((row, i) => (
            <div key={i} className="flex items-center">
              <div className={`${fullSize ? 'w-36' : 'w-28'} shrink-0 pr-2 text-right`}>
                <span className="text-[10px] text-slate-400 font-medium">{getFieldLabel(fields[i])}</span>
              </div>
              {row.map((cell, j) => (
                <div
                  key={j}
                  className={`${fullSize ? 'w-24 h-10' : 'w-16 h-8'} shrink-0 flex items-center justify-center ${getColor(cell.value)} rounded-sm m-[1px] transition-all hover:scale-110 hover:z-10 cursor-default`}
                  title={`${getFieldLabel(cell.xKey)} ↔ ${getFieldLabel(cell.yKey)}: ${cell.value.toFixed(3)}`}
                >
                  <span className={`${fullSize ? 'text-xs' : 'text-[9px]'} font-mono font-medium`}>
                    {cell.value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-slate-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" /> Negatif (güçlü)
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-slate-600" /> Zayıf / Yok
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" /> Pozitif (güçlü)
        </div>
      </div>
    </div>
  );
}
