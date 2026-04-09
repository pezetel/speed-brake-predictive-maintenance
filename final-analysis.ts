// ============================================================
// SPEEDBRAKE TAHMİNSEL BAKIM SİMÜLASYONU - FİNAL ANALİZ
// speed brake info.xlsx (tüm uçuş verisi) vs
// speedbrake arızaları filtreli.xlsx (gerçek arıza kayıtları)
//
// Amaç:
//   1. Uçuş verisi tarih aralığı içindeki gerçek arızaları bul
//   2. Her arıza için 90 gün öncesinde kritik/uyarı sinyali var mı?
//   3. Yakalanan arızaların yüzdesi (kritikten / uyarıdan)
//   4. Yakalanmayan arızalar hangileri?
//   5. Arıza dışında kaç ekstra uyarı/kritik çıkıyor?
//   6. Genel özet tablo
//
// Çalıştır: npx tsx final-analysis.ts
// ============================================================

import * as XLSX from 'xlsx';
import { parseExcelData } from './lib/utils';
import { FlightRecord } from './lib/types';

const FAULT_FILE = 'speedbrake arızaları filtreli.xlsx';
const DATA_FILE = 'speed brake info.xlsx';

// ─── 1. Uçuş Verisini Oku ───────────────────────────────────
console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║  SPEEDBRAKE TAHMİNSEL BAKIM - FİNAL ANALİZ                     ║');
console.log('╚══════════════════════════════════════════════════════════════════╝');
console.log('');
console.log('📂 Uçuş verisi okunuyor: ' + DATA_FILE);

const dataWb = XLSX.readFile(DATA_FILE);
let allFlights: FlightRecord[] = [];
for (const sheetName of dataWb.SheetNames) {
  const ws = dataWb.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
  allFlights = allFlights.concat(parseExcelData(rows));
}
console.log('  Toplam uçuş kaydı: ' + allFlights.length);

// Tarih aralığını bul
let minDate = '9999-12-31';
let maxDate = '0000-01-01';
for (const f of allFlights) {
  if (f.flightDate < minDate) minDate = f.flightDate;
  if (f.flightDate > maxDate) maxDate = f.flightDate;
}
console.log('  Tarih aralığı: ' + minDate + ' → ' + maxDate);

// Kuyruk numarasına göre grupla
const byTail = new Map<string, FlightRecord[]>();
for (const f of allFlights) {
  let arr = byTail.get(f.tailNumber);
  if (!arr) { arr = []; byTail.set(f.tailNumber, arr); }
  arr.push(f);
}
for (const [, arr] of byTail) arr.sort((a, b) => a.flightDate.localeCompare(b.flightDate));
console.log('  Toplam uçak: ' + byTail.size);

// ─── 2. Arıza Kayıtlarını Oku ───────────────────────────────
console.log('');
console.log('📂 Arıza verisi okunuyor: ' + FAULT_FILE);
const faultWb = XLSX.readFile(FAULT_FILE);

interface FaultRecord {
  tail: string;
  date: string;
  desc: string;
  wo: string;
  ata: string;
}

const allFaults: FaultRecord[] = [];
for (const sheetName of faultWb.SheetNames) {
  const ws = faultWb.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
  for (const row of rows) {
    let tail = String(row['A/C'] || '').trim().toUpperCase();
    if (tail && !tail.startsWith('TC-')) tail = 'TC-' + tail;
    let date = '';
    const dv = row['Date'];
    if (typeof dv === 'number' && dv > 40000 && dv < 50000) {
      const d = new Date((dv - 25569) * 86400 * 1000);
      date = d.toISOString().split('T')[0];
    } else if (dv instanceof Date) {
      date = dv.toISOString().split('T')[0];
    }
    const desc = String(row['Description'] || '')
      .replace(/<br>/gi, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/\s+/g, ' ')
      .trim();
    const wo = String(row['W/O'] || '').trim();
    const ata = String(row['ATA'] || '').trim();
    if (tail && date) allFaults.push({ tail, date, desc, wo, ata });
  }
}

// Tarihe göre sırala
allFaults.sort((a, b) => a.date.localeCompare(b.date));
console.log('  Toplam arıza kaydı: ' + allFaults.length);

// Uçuş verisi tarih aralığında olanları filtrele
const faultsInRange = allFaults.filter(f => f.date >= minDate && f.date <= maxDate);
const faultsBeforeRange = allFaults.filter(f => f.date < minDate);
const faultsAfterRange = allFaults.filter(f => f.date > maxDate);

console.log('  Uçuş verisi aralığında: ' + faultsInRange.length + ' arıza');
console.log('  Aralık öncesi (hariç): ' + faultsBeforeRange.length + ' arıza');
console.log('  Aralık sonrası (hariç): ' + faultsAfterRange.length + ' arıza');

// ─── 3. Yardımcı Fonksiyonlar ───────────────────────────────
function daysDiff(a: string, b: string): number {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
}

function pct(n: number, total: number): string {
  if (total === 0) return '0.0%';
  return ((n / total) * 100).toFixed(1) + '%';
}

function pctNum(n: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((n / total) * 1000) / 10;
}

// ─── 4. Her Arıza İçin Tespit Analizi (90 gün penceresi) ────
interface FaultDetection {
  fault: FaultRecord;
  tailFlights: number;
  // Arıza öncesi 90 gün
  critBefore90: number;
  warnBefore90: number;
  anySig90: boolean;
  // İlk sinyal bilgisi
  firstSignalDate: string;
  firstSignalType: string;
  firstSignalDaysBefore: number;
  // Arıza öncesi en yakın kritik/uyarı
  nearestCritDate: string;
  nearestCritDays: number;
  nearestWarnDate: string;
  nearestWarnDays: number;
  // Tespit kategorisi
  detectedBy: 'CRITICAL' | 'WARNING' | 'UNDETECTED';
}

const detections: FaultDetection[] = [];

for (const fault of faultsInRange) {
  const flights = byTail.get(fault.tail) || [];
  let c90 = 0, w90 = 0;
  let nearestCritDate = '', nearestCritDays = 999;
  let nearestWarnDate = '', nearestWarnDays = 999;
  let firstSigDate = '', firstSigType = '', firstSigDays = 0;

  for (const f of flights) {
    const diff = daysDiff(fault.date, f.flightDate); // pozitif = uçuş arızadan önce
    if (diff > 0 && diff <= 90) {
      if (f.anomalyLevel === 'critical') {
        c90++;
        if (diff < nearestCritDays) {
          nearestCritDays = diff;
          nearestCritDate = f.flightDate;
        }
        if (!firstSigDate || f.flightDate < firstSigDate) {
          firstSigDate = f.flightDate;
          firstSigType = 'CRITICAL';
          firstSigDays = diff;
        }
      } else if (f.anomalyLevel === 'warning') {
        w90++;
        if (diff < nearestWarnDays) {
          nearestWarnDays = diff;
          nearestWarnDate = f.flightDate;
        }
        if (!firstSigDate || f.flightDate < firstSigDate) {
          firstSigDate = f.flightDate;
          firstSigType = 'WARNING';
          firstSigDays = diff;
        }
      }
    }
  }

  let detectedBy: 'CRITICAL' | 'WARNING' | 'UNDETECTED' = 'UNDETECTED';
  if (c90 > 0) detectedBy = 'CRITICAL';
  else if (w90 > 0) detectedBy = 'WARNING';

  detections.push({
    fault,
    tailFlights: flights.length,
    critBefore90: c90,
    warnBefore90: w90,
    anySig90: c90 + w90 > 0,
    firstSignalDate: firstSigDate,
    firstSignalType: firstSigType,
    firstSignalDaysBefore: firstSigDays,
    nearestCritDate: nearestCritDate || '-',
    nearestCritDays: nearestCritDays === 999 ? -1 : nearestCritDays,
    nearestWarnDate: nearestWarnDate || '-',
    nearestWarnDays: nearestWarnDays === 999 ? -1 : nearestWarnDays,
    detectedBy,
  });
}

// ─── 5. Kategorilere Ayır ────────────────────────────────────
const detectedByCritical = detections.filter(d => d.detectedBy === 'CRITICAL');
const detectedByWarning = detections.filter(d => d.detectedBy === 'WARNING');
const undetected = detections.filter(d => d.detectedBy === 'UNDETECTED');
const totalDetectable = detections.length;

// ─── 6. Arıza Dışı Ekstra Uyarı/Kritik Hesapla ─────────────
// Arızalı kuyrukların arıza tarihlerinden 90g öncesindeki uçuşlar
// "gerçek sinyal" olarak sayılır. Bunların dışında kalan tüm
// warning/critical uçuşlar "ekstra" (false positive veya henüz
// arızaya dönüşmemiş) sinyallerdir.

// Arızalı uçuşları işaretle
const faultTails = new Set(allFaults.map(f => f.tail));
const faultTailsInRange = new Set(faultsInRange.map(f => f.tail));

// Tüm uçuşlardaki anomali sayıları
let totalCritFlights = 0;
let totalWarnFlights = 0;
let totalNormalFlights = 0;

// Arızalı kuyruk anomalileri (arıza ile ilişkilendirilebilir)
let faultRelatedCrit = 0;
let faultRelatedWarn = 0;

// Arızasız kuyruk anomalileri (ekstra sinyal)
let extraCritFromHealthyTails = 0;
let extraWarnFromHealthyTails = 0;

for (const f of allFlights) {
  if (f.anomalyLevel === 'critical') totalCritFlights++;
  else if (f.anomalyLevel === 'warning') totalWarnFlights++;
  else totalNormalFlights++;
}

// Arızalı kuyruklar vs arızasız kuyruklar ayrımı
for (const [tail, flights] of byTail) {
  if (faultTails.has(tail)) {
    // Arızalı kuyruk — sinyal arıza ile ilişkili sayılır
    for (const f of flights) {
      if (f.anomalyLevel === 'critical') faultRelatedCrit++;
      else if (f.anomalyLevel === 'warning') faultRelatedWarn++;
    }
  } else {
    // Arızasız kuyruk — sinyaller ekstra
    for (const f of flights) {
      if (f.anomalyLevel === 'critical') extraCritFromHealthyTails++;
      else if (f.anomalyLevel === 'warning') extraWarnFromHealthyTails++;
    }
  }
}

// ─── 7. SONUÇ TABLOLARI ─────────────────────────────────────

console.log('');
console.log('╔══════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    TABLO 1: GENEL ÖZET                                                 ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════════════════╝');
console.log('');
console.log('  ┌─────────────────────────────────────┬──────────────┐');
console.log('  │ Metrik                               │ Değer        │');
console.log('  ├─────────────────────────────────────┼──────────────┤');
console.log('  │ Toplam uçuş kaydı                    │ ' + String(allFlights.length).padStart(12) + ' │');
console.log('  │ Toplam uçak sayısı                   │ ' + String(byTail.size).padStart(12) + ' │');
console.log('  │ Uçuş verisi başlangıcı               │ ' + minDate.padStart(12) + ' │');
console.log('  │ Uçuş verisi bitişi                   │ ' + maxDate.padStart(12) + ' │');
console.log('  │ Gerçek arıza kaydı (toplam)          │ ' + String(allFaults.length).padStart(12) + ' │');
console.log('  │ Arıza (veri aralığında)              │ ' + String(faultsInRange.length).padStart(12) + ' │');
console.log('  │ Arızalı kuyruk sayısı                │ ' + String(faultTailsInRange.size).padStart(12) + ' │');
console.log('  └─────────────────────────────────────┴──────────────┘');

console.log('');
console.log('╔══════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('║          TABLO 2: TAHMİNSEL BAKIM GÖRÜNÜMÜ (Sistemde Ne Görünürdü?)                    ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════════════════╝');
console.log('');
console.log('  Tüm filo uçuşlarındaki anomali dağılımı:');
console.log('');
console.log('  ┌─────────────────────────┬──────────┬────────────┐');
console.log('  │ Seviye                   │ Sayı     │ Yüzde      │');
console.log('  ├─────────────────────────┼──────────┼────────────┤');
console.log('  │ 🟢 Normal                │ ' + String(totalNormalFlights).padStart(8) + ' │ ' + pct(totalNormalFlights, allFlights.length).padStart(10) + ' │');
console.log('  │ 🟡 Uyarı (Warning)       │ ' + String(totalWarnFlights).padStart(8) + ' │ ' + pct(totalWarnFlights, allFlights.length).padStart(10) + ' │');
console.log('  │ 🔴 Kritik (Critical)     │ ' + String(totalCritFlights).padStart(8) + ' │ ' + pct(totalCritFlights, allFlights.length).padStart(10) + ' │');
console.log('  ├─────────────────────────┼──────────┼────────────┤');
console.log('  │ TOPLAM                   │ ' + String(allFlights.length).padStart(8) + ' │ ' + '100.0%'.padStart(10) + ' │');
console.log('  └─────────────────────────┴──────────┴────────────┘');
console.log('');
console.log('  → Tahminsel bakımda ' + (totalCritFlights + totalWarnFlights) + ' item görünürdü');
console.log('    (' + totalCritFlights + ' kritik + ' + totalWarnFlights + ' uyarı)');

console.log('');
console.log('╔══════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('║          TABLO 3: GERÇEK ARIZA TESPİT ORANI (90 Gün Penceresi)                         ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════════════════╝');
console.log('');
console.log('  Değerlendirme: Her gerçek arıza için, arıza tarihinden 90 gün ÖNCESİNDE');
console.log('  sistemde kritik veya uyarı sinyali oluşmuş mu?');
console.log('');
console.log('  ┌──────────────────────────────────┬──────────┬────────────┐');
console.log('  │ Tespit Kategorisi                 │ Sayı     │ Yüzde      │');
console.log('  ├──────────────────────────────────┼──────────┼────────────┤');
console.log('  │ 🔴 Kritikten yakalanan            │ ' + String(detectedByCritical.length).padStart(8) + ' │ ' + pct(detectedByCritical.length, totalDetectable).padStart(10) + ' │');
console.log('  │ 🟡 Uyarıdan yakalanan             │ ' + String(detectedByWarning.length).padStart(8) + ' │ ' + pct(detectedByWarning.length, totalDetectable).padStart(10) + ' │');
console.log('  │ ✅ TOPLAM YAKALANAN               │ ' + String(detectedByCritical.length + detectedByWarning.length).padStart(8) + ' │ ' + pct(detectedByCritical.length + detectedByWarning.length, totalDetectable).padStart(10) + ' │');
console.log('  │ ❌ Yakalanamayan                   │ ' + String(undetected.length).padStart(8) + ' │ ' + pct(undetected.length, totalDetectable).padStart(10) + ' │');
console.log('  ├──────────────────────────────────┼──────────┼────────────┤');
console.log('  │ TOPLAM ARIZA (veri aralığında)    │ ' + String(totalDetectable).padStart(8) + ' │ ' + '100.0%'.padStart(10) + ' │');
console.log('  └──────────────────────────────────┴──────────┴────────────┘');

console.log('');
console.log('╔══════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('║          TABLO 4: YAKALANAN ARIZALARIN DETAYI                                           ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════════════════╝');
console.log('');
console.log('  ' +
  'Kuyruk'.padEnd(10) +
  'Arıza Trh'.padEnd(13) +
  'Tespit'.padEnd(10) +
  'Krit#'.padStart(6) +
  'Uyar#'.padStart(6) +
  '  İlk Sinyal'.padEnd(14) +
  'Gün Önce'.padStart(10) +
  '  Açıklama'
);
console.log('  ' + '─'.repeat(120));

const detected = [...detectedByCritical, ...detectedByWarning];
detected.sort((a, b) => a.fault.date.localeCompare(b.fault.date));

for (const d of detected) {
  const icon = d.detectedBy === 'CRITICAL' ? '🔴' : '🟡';
  console.log('  ' +
    d.fault.tail.padEnd(10) +
    d.fault.date.padEnd(13) +
    (icon + ' ' + d.detectedBy).padEnd(12) +
    String(d.critBefore90).padStart(4) +
    String(d.warnBefore90).padStart(6) +
    '  ' + (d.firstSignalDate || '-').padEnd(12) +
    String(d.firstSignalDaysBefore).padStart(10) +
    '  ' + d.fault.desc.substring(0, 50)
  );
}

console.log('');
console.log('╔══════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('║          TABLO 5: YAKALANMAYAN ARIZALAR                                                 ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════════════════╝');
console.log('');

if (undetected.length === 0) {
  console.log('  ✅ Tüm arızalar tespit edildi!');
} else {
  console.log('  ' +
    'Kuyruk'.padEnd(10) +
    'Arıza Trh'.padEnd(13) +
    'Uçuş#'.padStart(7) +
    '  W/O'.padEnd(15) +
    '  Açıklama'
  );
  console.log('  ' + '─'.repeat(120));

  for (const d of undetected) {
    console.log('  ' +
      d.fault.tail.padEnd(10) +
      d.fault.date.padEnd(13) +
      String(d.tailFlights).padStart(7) +
      '  ' + (d.fault.wo || '-').padEnd(13) +
      '  ' + d.fault.desc.substring(0, 70)
    );
  }

  // Yakalanmayanlar için olası sebepler
  console.log('');
  console.log('  📋 Yakalanmama Olası Sebepleri:');
  const noFlightData = undetected.filter(d => d.tailFlights === 0);
  const hasFlightButNoSig = undetected.filter(d => d.tailFlights > 0);
  if (noFlightData.length > 0) {
    console.log('    • Uçuş verisi olmayan: ' + noFlightData.length + ' arıza (kuyruk speed brake info\'da yok)');
  }
  if (hasFlightButNoSig.length > 0) {
    console.log('    • Uçuş verisi var ama 90g öncesinde sinyal yok: ' + hasFlightButNoSig.length + ' arıza');
    console.log('      (Ani arıza olabilir veya mevcut kriterler bu tip bozulmayı yakalayamıyor)');
  }
}

console.log('');
console.log('╔══════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('║          TABLO 6: EKSTRA SİNYALLER (Arıza Dışı Uyarı/Kritikler)                        ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════════════════╝');
console.log('');
console.log('  Arızalı kuyruklardaki sinyaller gerçek arızayla ilişkilendirilebilir.');
console.log('  Arızasız kuyruklardaki sinyaller "ekstra" sinyallerdir.');
console.log('');
console.log('  ┌──────────────────────────────────────┬──────────┬──────────┐');
console.log('  │ Kaynak                                │ Kritik   │ Uyarı    │');
console.log('  ├──────────────────────────────────────┼──────────┼──────────┤');
console.log('  │ Arızalı kuyruklar (ilişkili sinyal)   │ ' + String(faultRelatedCrit).padStart(8) + ' │ ' + String(faultRelatedWarn).padStart(8) + ' │');
console.log('  │ Arızasız kuyruklar (ekstra sinyal)    │ ' + String(extraCritFromHealthyTails).padStart(8) + ' │ ' + String(extraWarnFromHealthyTails).padStart(8) + ' │');
console.log('  ├──────────────────────────────────────┼──────────┼──────────┤');
console.log('  │ TOPLAM                                │ ' + String(totalCritFlights).padStart(8) + ' │ ' + String(totalWarnFlights).padStart(8) + ' │');
console.log('  └──────────────────────────────────────┴──────────┴──────────┘');
console.log('');
console.log('  → Arızasız kuyruklardan toplam ' + (extraCritFromHealthyTails + extraWarnFromHealthyTails) + ' ekstra sinyal çıkıyor');
console.log('    (' + extraCritFromHealthyTails + ' kritik + ' + extraWarnFromHealthyTails + ' uyarı)');
console.log('    Bu sinyaller ya false positive ya da henüz arızaya dönüşmemiş erken uyarıdır.');

// ─── 8. Arızasız Kuyruklardaki Anomali Detayı ───────────────
console.log('');
console.log('  Arızasız kuyruklar arasında en çok sinyal çıkaranlar:');
console.log('  ' + '─'.repeat(80));
console.log('  ' +
  'Kuyruk'.padEnd(10) +
  'Uçuş'.padStart(7) +
  'Kritik'.padStart(8) +
  'Uyarı'.padStart(8) +
  'Normal'.padStart(8) +
  '  Krit%'.padStart(8) +
  '  Uyar%'.padStart(8)
);
console.log('  ' + '─'.repeat(80));

interface TailSummary {
  tail: string;
  flights: number;
  crit: number;
  warn: number;
  norm: number;
}

const healthyTailSummaries: TailSummary[] = [];
for (const [tail, flights] of byTail) {
  if (faultTails.has(tail)) continue;
  let c = 0, w = 0, n = 0;
  for (const f of flights) {
    if (f.anomalyLevel === 'critical') c++;
    else if (f.anomalyLevel === 'warning') w++;
    else n++;
  }
  if (c + w > 0) {
    healthyTailSummaries.push({ tail, flights: flights.length, crit: c, warn: w, norm: n });
  }
}
healthyTailSummaries.sort((a, b) => (b.crit + b.warn) - (a.crit + a.warn));

for (const ts of healthyTailSummaries.slice(0, 15)) {
  console.log('  ' +
    ts.tail.padEnd(10) +
    String(ts.flights).padStart(7) +
    String(ts.crit).padStart(8) +
    String(ts.warn).padStart(8) +
    String(ts.norm).padStart(8) +
    ('  ' + pct(ts.crit, ts.flights)).padStart(8) +
    ('  ' + pct(ts.warn, ts.flights)).padStart(8)
  );
}
if (healthyTailSummaries.length > 15) {
  console.log('  ... ve ' + (healthyTailSummaries.length - 15) + ' kuyruk daha');
}

// ─── 9. BÜYÜK ÖZET TABLO ────────────────────────────────────
console.log('');
console.log('╔══════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('║                                                                                        ║');
console.log('║                    ★★★  GENEL SONUÇ TABLOSU  ★★★                                       ║');
console.log('║                                                                                        ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════════════════╝');
console.log('');
console.log('  ┌────────────────────────────────────────────────────────────────────────────────┐');
console.log('  │                  TAHMİNSEL BAKIM SİSTEMİ PERFORMANS ÖZETİ                     │');
console.log('  ├────────────────────────────────────────────────────────────────────────────────┤');
console.log('  │                                                                                │');
console.log('  │  📊 SİSTEMDE GÖRÜNECEK TOPLAM İTEM SAYISI                                     │');
console.log('  │  ─────────────────────────────────────────                                     │');
console.log('  │    🔴 Kritik uyarılar:         ' + String(totalCritFlights).padStart(7) + ' uçuş                                │');
console.log('  │    🟡 Uyarılar:                ' + String(totalWarnFlights).padStart(7) + ' uçuş                                │');
console.log('  │    TOPLAM İTEM:                ' + String(totalCritFlights + totalWarnFlights).padStart(7) + ' uçuş                                │');
console.log('  │    (Toplam ' + allFlights.length + ' uçuşun ' + pct(totalCritFlights + totalWarnFlights, allFlights.length) + "'" + (pctNum(totalCritFlights + totalWarnFlights, allFlights.length) < 10 ? 'i' : 'si') + ')' + ' '.repeat(30) + '│');
console.log('  │                                                                                │');
console.log('  │  ✅ GERÇEK ARIZA TESPİT PERFORMANSI (90 gün penceresi)                        │');
console.log('  │  ─────────────────────────────────────────────────                             │');
console.log('  │    Değerlendirilen arıza:      ' + String(totalDetectable).padStart(7) + ' adet                                │');
console.log('  │    Kritikten yakalanan:         ' + String(detectedByCritical.length).padStart(6) + ' adet  (' + pct(detectedByCritical.length, totalDetectable).padStart(6) + ')                    │');
console.log('  │    Uyarıdan yakalanan:          ' + String(detectedByWarning.length).padStart(6) + ' adet  (' + pct(detectedByWarning.length, totalDetectable).padStart(6) + ')                    │');
console.log('  │    ────────────────────────────────────                                        │');
console.log('  │    TOPLAM YAKALANAN:            ' + String(detectedByCritical.length + detectedByWarning.length).padStart(6) + ' adet  (' + pct(detectedByCritical.length + detectedByWarning.length, totalDetectable).padStart(6) + ')  ✅             │');
console.log('  │    YAKALANMAYAN:                ' + String(undetected.length).padStart(6) + ' adet  (' + pct(undetected.length, totalDetectable).padStart(6) + ')  ❌             │');
console.log('  │                                                                                │');
console.log('  │  📈 EKSTRA SİNYALLER (arızasız kuyruklardan)                                  │');
console.log('  │  ─────────────────────────────────────────────                                 │');
console.log('  │    Ekstra kritik:              ' + String(extraCritFromHealthyTails).padStart(7) + ' uçuş                                │');
console.log('  │    Ekstra uyarı:               ' + String(extraWarnFromHealthyTails).padStart(7) + ' uçuş                                │');
console.log('  │    TOPLAM EKSTRA:              ' + String(extraCritFromHealthyTails + extraWarnFromHealthyTails).padStart(7) + ' uçuş                                │');
console.log('  │    (False positive veya erken uyarı olabilir)                                  │');
console.log('  │                                                                                │');
console.log('  └────────────────────────────────────────────────────────────────────────────────┘');

// ─── 10. Arıza bazlı tam liste ──────────────────────────────
console.log('');
console.log('╔══════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('║          TABLO 7: TÜM ARIZALARIN TAM LİSTESİ                                           ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════════════════╝');
console.log('');
console.log('  ' +
  '#'.padStart(3) +
  '  Kuyruk'.padEnd(11) +
  'Arıza Trh'.padEnd(13) +
  'Tespit'.padEnd(13) +
  'Krit90'.padStart(7) +
  'Uyar90'.padStart(7) +
  '  Açıklama'
);
console.log('  ' + '─'.repeat(120));

detections.sort((a, b) => a.fault.date.localeCompare(b.fault.date));
for (let i = 0; i < detections.length; i++) {
  const d = detections[i];
  let icon = '❌';
  if (d.detectedBy === 'CRITICAL') icon = '🔴';
  else if (d.detectedBy === 'WARNING') icon = '🟡';

  console.log('  ' +
    String(i + 1).padStart(3) +
    '  ' + d.fault.tail.padEnd(9) +
    d.fault.date.padEnd(13) +
    (icon + ' ' + d.detectedBy).padEnd(15) +
    String(d.critBefore90).padStart(5) +
    String(d.warnBefore90).padStart(7) +
    '  ' + d.fault.desc.substring(0, 55)
  );
}

// ─── 11. 30/60/90 gün karşılaştırması ───────────────────────
console.log('');
console.log('╔══════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('║          TABLO 8: ZAMAN PENCERESİ KARŞILAŞTIRMASI                                       ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════════════════╝');
console.log('');

// 30 ve 60 gün için de hesapla
let det30_crit = 0, det30_warn = 0, det30_any = 0;
let det60_crit = 0, det60_warn = 0, det60_any = 0;

for (const fault of faultsInRange) {
  const flights = byTail.get(fault.tail) || [];
  let c30 = 0, w30 = 0, c60 = 0, w60 = 0;
  for (const f of flights) {
    const diff = daysDiff(fault.date, f.flightDate);
    if (diff > 0 && diff <= 60) {
      if (f.anomalyLevel === 'critical') { c60++; if (diff <= 30) c30++; }
      else if (f.anomalyLevel === 'warning') { w60++; if (diff <= 30) w30++; }
    }
  }
  if (c30 > 0) det30_crit++;
  if (c30 > 0 || w30 > 0) det30_any++;
  else if (w30 > 0) det30_warn++; // sadece uyarıdan
  if (c60 > 0) det60_crit++;
  if (c60 > 0 || w60 > 0) det60_any++;
  else if (w60 > 0) det60_warn++;
}

// det30_warn sadece uyarıdan yakalanan (kritik yok) hesaplayalım doğru
det30_warn = det30_any - det30_crit;
det60_warn = det60_any - det60_crit;
const det90_crit = detectedByCritical.length;
const det90_warn = detectedByWarning.length;
const det90_any = det90_crit + det90_warn;

console.log('  ┌──────────────────┬────────────────────┬────────────────────┬────────────────────┐');
console.log('  │ Pencere           │ Kritikten Yakala   │ Uyarıdan Yakala    │ Toplam Yakalanan   │');
console.log('  ├──────────────────┼────────────────────┼────────────────────┼────────────────────┤');
console.log('  │ Son 30 gün       │ ' + (det30_crit + ' (' + pct(det30_crit, totalDetectable) + ')').padEnd(18) + ' │ ' + (det30_warn + ' (' + pct(det30_warn, totalDetectable) + ')').padEnd(18) + ' │ ' + (det30_any + ' (' + pct(det30_any, totalDetectable) + ')').padEnd(18) + ' │');
console.log('  │ Son 60 gün       │ ' + (det60_crit + ' (' + pct(det60_crit, totalDetectable) + ')').padEnd(18) + ' │ ' + (det60_warn + ' (' + pct(det60_warn, totalDetectable) + ')').padEnd(18) + ' │ ' + (det60_any + ' (' + pct(det60_any, totalDetectable) + ')').padEnd(18) + ' │');
console.log('  │ Son 90 gün       │ ' + (det90_crit + ' (' + pct(det90_crit, totalDetectable) + ')').padEnd(18) + ' │ ' + (det90_warn + ' (' + pct(det90_warn, totalDetectable) + ')').padEnd(18) + ' │ ' + (det90_any + ' (' + pct(det90_any, totalDetectable) + ')').padEnd(18) + ' │');
console.log('  └──────────────────┴────────────────────┴────────────────────┴────────────────────┘');

// ─── 12. Lead Time İstatistikleri ────────────────────────────
const detectedWithLead = detections.filter(d => d.detectedBy !== 'UNDETECTED' && d.firstSignalDaysBefore > 0);
if (detectedWithLead.length > 0) {
  const leadTimes = detectedWithLead.map(d => d.firstSignalDaysBefore);
  leadTimes.sort((a, b) => a - b);
  const avg = leadTimes.reduce((s, v) => s + v, 0) / leadTimes.length;
  const median = leadTimes[Math.floor(leadTimes.length / 2)];

  console.log('');
  console.log('  ⏱️  İlk Sinyal → Arıza Arası Süre:');
  console.log('    Minimum:  ' + leadTimes[0] + ' gün');
  console.log('    Medyan:   ' + median + ' gün');
  console.log('    Ortalama: ' + avg.toFixed(1) + ' gün');
  console.log('    Maksimum: ' + leadTimes[leadTimes.length - 1] + ' gün');
}

console.log('');
console.log('═'.repeat(90));
console.log('  Analiz tamamlandı. ✅');
console.log('═'.repeat(90));
console.log('');
