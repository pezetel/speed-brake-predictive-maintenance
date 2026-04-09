'use client';

import {
  Brain, AlertTriangle, Gauge, Timer, Ruler,
  Droplets, Wrench, Radio, TrendingDown,
  Activity, GitCompareArrows, Shield, Target
} from 'lucide-react';

export default function DocsTab() {
  return (
    <div className="space-y-4 animate-fade-in max-w-5xl mx-auto">

      {/* Genel Mantık */}
      <div className="card border-blue-500/20">
        <h2 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4" /> Sistem Mantığı
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Excel&apos;den yüklenen her uçuş satırı bir <code className="text-cyan-400 bg-slate-700/50 px-1 rounded">FlightRecord</code>&apos;a dönüşür.
          Her kayıt üzerinde <strong className="text-white">8 farklı sinyal</strong> kontrol edilir ve her sinyal bir puan üretir.
          Puanlar toplanarak uçuş <span className="text-emerald-400">Normal</span>, <span className="text-amber-400">Warning</span> veya <span className="text-red-400">Critical</span> olarak sınıflandırılır.
          Tek bir parametredeki hafif sapma alarm üretmez — birden fazla sinyalin aynı anda anormal olması gerekir.
        </p>
      </div>

      {/* Parametreler */}
      <div className="card border-cyan-500/20">
        <h2 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" /> Temel Parametreler
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { field: 'PFD Turn 1 (%)', desc: 'Speedbrake açılma yüzdesi. ~100% normal. >150% çift panel kaydı.' },
            { field: 'Duration Derivative (s)', desc: 'Türev-bazlı açılma süresi. Düşük = hızlı yanıt.' },
            { field: 'Duration ExtTo99 (s)', desc: '%99 pozisyonuna ulaşma süresi. Uzun = yavaşlama.' },
            { field: 'PFD Turn 1 Açı (°)', desc: 'İlk hareket açısı (derece).' },
            { field: 'İniş Mesafesi 30kn (m)', desc: '30 knot\'a düşene kadar mesafe.' },
            { field: 'İniş Mesafesi 50kn (m)', desc: '50 knot\'a düşene kadar mesafe. 30kn\'dan kısa olmalı.' },
          ].map((p) => (
            <div key={p.field} className="bg-slate-700/30 rounded-lg px-3 py-2">
              <span className="text-[11px] font-bold text-cyan-400">{p.field}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">{p.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { field: 'normalizedPfd', formula: 'PFD>150 → PFD / round(PFD/100)' },
            { field: 'durationRatio', formula: 'extTo99 / derivative' },
            { field: 'isDoubledRecord', formula: 'PFD > 150' },
            { field: 'landingDistAnomaly', formula: 'dist50 > dist30 × 1.05' },
          ].map((d) => (
            <div key={d.field} className="bg-amber-500/5 rounded-lg px-3 py-2 border border-amber-500/10">
              <code className="text-[10px] text-amber-400 font-mono">{d.field}</code>
              <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{d.formula}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 8 Sinyal */}
      <div className="card border-red-500/20">
        <h2 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
          <Target className="w-4 h-4" /> Anomali Sinyalleri & Puanlar
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 py-2 px-2 font-medium">#</th>
                <th className="text-left text-slate-400 py-2 px-2 font-medium">Sinyal</th>
                <th className="text-left text-slate-400 py-2 px-2 font-medium">Koşul</th>
                <th className="text-right text-slate-400 py-2 px-2 font-medium">Puan</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {[
                { n: 1, signal: 'PFD Düşük', cond: '<60%  /  60-75%  /  75-85%  /  85-92%', score: '+60 / +45 / +25 / +8' },
                { n: 2, signal: 'Duration Ratio', cond: '>6x & >8s  /  >4x & >5s  /  >3x & >4s', score: '+40 / +25 / +12' },
                { n: 3, signal: 'Extension Süresi', cond: '>15s  /  10-15s', score: '+35 / +15' },
                { n: 4, signal: 'İniş Mesafesi Ters', cond: '50kn > 30kn × 1.05', score: '+30' },
                { n: 5, signal: 'Açı + PFD', cond: '<20° & PFD<75%  /  <25° & PFD<80%  /  Δdeg>10 & PFD<85%', score: '+40 / +25 / +20' },
                { n: 6, signal: 'Çift Panel', cond: 'PFD > 150%', score: '+0 (bilgi)' },
                { n: 7, signal: 'GS at SBOP', cond: '< 1500', score: '+5' },
                { n: 8, signal: 'PFD + İniş Combo', cond: 'PFD<85% & mesafe>1800m', score: '+15' },
              ].map((r) => (
                <tr key={r.n} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                  <td className="py-1.5 px-2 text-slate-500">{r.n}</td>
                  <td className="py-1.5 px-2 font-medium text-white">{r.signal}</td>
                  <td className="py-1.5 px-2 text-slate-400 font-mono">{r.cond}</td>
                  <td className="py-1.5 px-2 text-right text-amber-400 font-mono">{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sınıflandırma */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card border-emerald-500/20 text-center">
          <div className="text-lg">✅</div>
          <div className="text-sm font-bold text-emerald-400">Normal</div>
          <div className="text-xs text-slate-400 font-mono">0 – 15 puan</div>
        </div>
        <div className="card border-amber-500/20 text-center">
          <div className="text-lg">⚠️</div>
          <div className="text-sm font-bold text-amber-400">Warning</div>
          <div className="text-xs text-slate-400 font-mono">16 – 39 puan</div>
        </div>
        <div className="card border-red-500/20 text-center">
          <div className="text-lg">🔴</div>
          <div className="text-sm font-bold text-red-400">Critical</div>
          <div className="text-xs text-slate-400 font-mono">40+ puan</div>
        </div>
      </div>

      {/* Sağlık Skoru */}
      <div className="card border-emerald-500/20">
        <h2 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Uçak Sağlık Skoru (0-100)
        </h2>
        <p className="text-xs text-slate-300 mb-3">
          Her kuyruk numarası için 100 üzerinden başlanır, risk faktörleri puanı düşürür:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[11px]">
          {[
            'PFD < 95% → (95 − ort.PFD) × 1.5 düş',
            'PFD < 80% → (80 − ort.PFD) × 2 ek düşüş',
            'Her kritik uçuş → −5',
            'Her uyarı uçuşu → −2',
            'Duration ratio > 2x → (ratio−2) × 5 düş',
            'İniş anomali oranı → oran × 20 düş',
          ].map((r, i) => (
            <div key={i} className="bg-slate-700/30 rounded px-3 py-1.5 text-slate-300">
              <span className="text-red-400 mr-1">−</span>{r}
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[11px]">
          <div className="bg-emerald-500/5 rounded py-1.5 border border-emerald-500/20"><span className="text-emerald-400 font-bold">LOW</span><br/><span className="text-slate-500">85-100</span></div>
          <div className="bg-amber-500/5 rounded py-1.5 border border-amber-500/20"><span className="text-amber-400 font-bold">MEDIUM</span><br/><span className="text-slate-500">70-84</span></div>
          <div className="bg-orange-500/5 rounded py-1.5 border border-orange-500/20"><span className="text-orange-400 font-bold">HIGH</span><br/><span className="text-slate-500">50-69</span></div>
          <div className="bg-red-500/5 rounded py-1.5 border border-red-500/20"><span className="text-red-400 font-bold">CRITICAL</span><br/><span className="text-slate-500">&lt;50</span></div>
        </div>
      </div>

      {/* Tahminsel Bakım */}
      <div className="card border-purple-500/20">
        <h2 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4" /> Tahminsel Bakım Kuralları
        </h2>
        <div className="space-y-2">
          {[
            { icon: <Droplets className="w-3.5 h-3.5 text-blue-400" />, title: 'Hidrolik Direnç', cond: 'Ort. ratio > 2.5x ve ≥2 uçuşta ratio > 3x' },
            { icon: <Wrench className="w-3.5 h-3.5 text-orange-400" />, title: 'Mekanik Arıza', cond: 'Ort. PFD < 80% veya kritik var, ≥1 uçuşta PFD<75% & açı<30°' },
            { icon: <Radio className="w-3.5 h-3.5 text-cyan-400" />, title: 'Yavaş Açılma', cond: 'Ort. PFD < 92%, ≥2 uçuşta açı farkı > 8° & PFD < 90%' },
            { icon: <Ruler className="w-3.5 h-3.5 text-amber-400" />, title: 'İniş Anomalisi', cond: 'Anomali oranı > %2, ≥2 uçuşta 50kn > 30kn' },
            { icon: <TrendingDown className="w-3.5 h-3.5 text-red-400" />, title: 'Degradasyon', cond: 'Trend = kötüleşiyor ve PFD düşüş > 5 puan' },
          ].map((r, i) => (
            <div key={i} className="flex items-start gap-2 bg-slate-700/20 rounded-lg px-3 py-2">
              <div className="mt-0.5">{r.icon}</div>
              <div>
                <span className="text-[11px] font-bold text-white">{r.title}</span>
                <span className="text-[11px] text-slate-400 ml-2">{r.cond}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Parametre İlişkileri */}
      <div className="card border-amber-500/20">
        <h2 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
          <GitCompareArrows className="w-4 h-4" /> Parametre İlişkileri
        </h2>
        <div className="space-y-1.5 text-[11px]">
          {[
            { rel: 'PFD ↔ Açı', info: 'PFD ~100% → 45-48°. İkisi de düşükse mekanik arıza.' },
            { rel: 'Derivative ↔ ExtTo99', info: 'ext >> deriv → hidrolik direnç.' },
            { rel: 'PFD ↔ İniş Mesafesi', info: 'Düşük PFD + uzun mesafe → yetersiz frenleme.' },
            { rel: '30kn ↔ 50kn', info: '50kn > 30kn fizik ihlali → sensör hatası.' },
          ].map((r, i) => (
            <div key={i} className="flex gap-3 bg-slate-700/20 rounded px-3 py-2">
              <span className="text-amber-400 font-bold w-32 shrink-0">{r.rel}</span>
              <span className="text-slate-300">{r.info}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
