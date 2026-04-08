import { FlightRecord, AircraftHealth, Anomaly } from './types';

const rawData: FlightRecord[] = [
  { flightDate: '8.04.2025', tailNumber: 'TC-SEI', takeoffAirport: 'AYT', landingAirport: 'DTM', pfdTurn1: 99.8234, durationDerivativeSec: 1.75, durationExtTo99Sec: 1.25, pfdTurn1Deg: 46.8, pfeTo99Deg: 46.6, landingDist30Knot: 994.089, landingDist50Knot: 902.983, gsAtAutoSbopSec: 13255.25 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEI', takeoffAirport: 'AYT', landingAirport: 'PAD', pfdTurn1: 100, durationDerivativeSec: 2.25, durationExtTo99Sec: 1.75, pfdTurn1Deg: 46.8, pfeTo99Deg: 46.7, landingDist30Knot: 909.275, landingDist50Knot: 768.31, gsAtAutoSbopSec: 14075.25 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEI', takeoffAirport: 'DTM', landingAirport: 'AYT', pfdTurn1: 99.8237, durationDerivativeSec: 2.25, durationExtTo99Sec: 1.75, pfdTurn1Deg: 46.9, pfeTo99Deg: 46.8, landingDist30Knot: 1487.56, landingDist50Knot: 1315.12, gsAtAutoSbopSec: 11993.75 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEJ', takeoffAirport: 'AYT', landingAirport: 'DUS', pfdTurn1: 200, durationDerivativeSec: 4.5, durationExtTo99Sec: 3.5, pfdTurn1Deg: 92.1, pfeTo99Deg: 92.1, landingDist30Knot: 2203.305, landingDist50Knot: 2016.576, gsAtAutoSbopSec: 27209 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEJ', takeoffAirport: 'DUS', landingAirport: 'AYT', pfdTurn1: 99.8203, durationDerivativeSec: 2.25, durationExtTo99Sec: 1.75, pfdTurn1Deg: 46, pfeTo99Deg: 46.1, landingDist30Knot: 1572.265, landingDist50Knot: 1243.135, gsAtAutoSbopSec: 12083.25 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEJ', takeoffAirport: 'DUS', landingAirport: 'COV', pfdTurn1: 100, durationDerivativeSec: 2.25, durationExtTo99Sec: 1.75, pfdTurn1Deg: 46.1, pfeTo99Deg: 46.1, landingDist30Knot: 1894.114, landingDist50Knot: 1695.593, gsAtAutoSbopSec: 12962.25 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEK', takeoffAirport: 'AYT', landingAirport: 'LTN', pfdTurn1: 100, durationDerivativeSec: 1.75, durationExtTo99Sec: 1.5, pfdTurn1Deg: 46.8, pfeTo99Deg: 46.4, landingDist30Knot: 1305.097, landingDist50Knot: 1181.311, gsAtAutoSbopSec: 16122.25 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEK', takeoffAirport: 'LTN', landingAirport: 'AYT', pfdTurn1: 99.8228, durationDerivativeSec: 1.75, durationExtTo99Sec: 1.25, pfdTurn1Deg: 46.7, pfeTo99Deg: 46.5, landingDist30Knot: 1613.69, landingDist50Knot: 1176.736, gsAtAutoSbopSec: 15285.25 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEM', takeoffAirport: 'AYT', landingAirport: 'FMO', pfdTurn1: 99.8215, durationDerivativeSec: 2.75, durationExtTo99Sec: 2.25, pfdTurn1Deg: 46.3, pfeTo99Deg: 46.3, landingDist30Knot: 1517.075, landingDist50Knot: 1150.232, gsAtAutoSbopSec: 12623.25 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEM', takeoffAirport: 'AYT', landingAirport: 'LEJ', pfdTurn1: 99.8215, durationDerivativeSec: 2.25, durationExtTo99Sec: 1.75, pfdTurn1Deg: 46.3, pfeTo99Deg: 46.1, landingDist30Knot: 1824.522, landingDist50Knot: 1674.661, gsAtAutoSbopSec: 11824.25 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEM', takeoffAirport: 'AYT', landingAirport: 'MUC', pfdTurn1: 99.8215, durationDerivativeSec: 2.25, durationExtTo99Sec: 2, pfdTurn1Deg: 46.3, pfeTo99Deg: 46.1, landingDist30Knot: 1950.046, landingDist50Knot: 1865.132, gsAtAutoSbopSec: 12261.25 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEM', takeoffAirport: 'LEJ', landingAirport: 'AYT', pfdTurn1: 99.8218, durationDerivativeSec: 2.25, durationExtTo99Sec: 1.75, pfdTurn1Deg: 46.4, pfeTo99Deg: 46.3, landingDist30Knot: 1765.219, landingDist50Knot: 1233.646, gsAtAutoSbopSec: 10800.25 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEM', takeoffAirport: 'MUC', landingAirport: 'AYT', pfdTurn1: 99.6437, durationDerivativeSec: 2, durationExtTo99Sec: 1.5, pfdTurn1Deg: 46.3, pfeTo99Deg: 46.2, landingDist30Knot: 1695.268, landingDist50Knot: 1310.378, gsAtAutoSbopSec: 10164 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEN', takeoffAirport: 'AYT', landingAirport: 'BER', pfdTurn1: 99.6475, durationDerivativeSec: 1.75, durationExtTo99Sec: 1.25, pfdTurn1Deg: 46.8, pfeTo99Deg: 46.7, landingDist30Knot: 1091.006, landingDist50Knot: 987.531, gsAtAutoSbopSec: 12492.75 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEN', takeoffAirport: 'AYT', landingAirport: 'COV', pfdTurn1: 99.8237, durationDerivativeSec: 2.25, durationExtTo99Sec: 1.75, pfdTurn1Deg: 46.9, pfeTo99Deg: 46.9, landingDist30Knot: 2015.561, landingDist50Knot: 2488.458, gsAtAutoSbopSec: 3994.75 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEN', takeoffAirport: 'AYT', landingAirport: 'PAD', pfdTurn1: 99.8234, durationDerivativeSec: 2.25, durationExtTo99Sec: 1.75, pfdTurn1Deg: 46.8, pfeTo99Deg: 46.8, landingDist30Knot: 1392.669, landingDist50Knot: 1103.313, gsAtAutoSbopSec: 13888.75 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEN', takeoffAirport: 'BER', landingAirport: 'AYT', pfdTurn1: 99.8237, durationDerivativeSec: 2.25, durationExtTo99Sec: 1.75, pfdTurn1Deg: 46.9, pfeTo99Deg: 46.8, landingDist30Knot: 1357.829, landingDist50Knot: 1277.173, gsAtAutoSbopSec: 11411.75 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEN', takeoffAirport: 'COV', landingAirport: 'AYT', pfdTurn1: 100, durationDerivativeSec: 2.25, durationExtTo99Sec: 1.75, pfdTurn1Deg: 47, pfeTo99Deg: 46.9, landingDist30Knot: 1556.932, landingDist50Knot: 1292.705, gsAtAutoSbopSec: 3678.75 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEO', takeoffAirport: 'AYT', landingAirport: 'ECN', pfdTurn1: 100, durationDerivativeSec: 2.75, durationExtTo99Sec: 2.25, pfdTurn1Deg: 45.8, pfeTo99Deg: 45.8, landingDist30Knot: 1331.333, landingDist50Knot: 1219.092, gsAtAutoSbopSec: 3320.25 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEO', takeoffAirport: 'AYT', landingAirport: 'HAM', pfdTurn1: 99.8189, durationDerivativeSec: 2.25, durationExtTo99Sec: 1.75, pfdTurn1Deg: 45.8, pfeTo99Deg: 45.8, landingDist30Knot: 1366.893, landingDist50Knot: 1224.057, gsAtAutoSbopSec: 13436.75 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEO', takeoffAirport: 'AYT', landingAirport: 'NUE', pfdTurn1: 100, durationDerivativeSec: 2.25, durationExtTo99Sec: 1.75, pfdTurn1Deg: 45.8, pfeTo99Deg: 45.8, landingDist30Knot: 1431.813, landingDist50Knot: 877.996, gsAtAutoSbopSec: 12072.75 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEO', takeoffAirport: 'ECN', landingAirport: 'AYT', pfdTurn1: 100, durationDerivativeSec: 2.25, durationExtTo99Sec: 1.75, pfdTurn1Deg: 45.8, pfeTo99Deg: 45.8, landingDist30Knot: 1315.122, landingDist50Knot: 1079.78, gsAtAutoSbopSec: 3335.75 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEO', takeoffAirport: 'HAM', landingAirport: 'AYT', pfdTurn1: 100, durationDerivativeSec: 2, durationExtTo99Sec: 1.5, pfdTurn1Deg: 45.8, pfeTo99Deg: 45.8, landingDist30Knot: 1272.011, landingDist50Knot: 1132.785, gsAtAutoSbopSec: 12364 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEU', takeoffAirport: 'AYT', landingAirport: 'BLL', pfdTurn1: 100, durationDerivativeSec: 2.25, durationExtTo99Sec: 1.75, pfdTurn1Deg: 46.3, pfeTo99Deg: 46.3, landingDist30Knot: 1592.152, landingDist50Knot: 1511.659, gsAtAutoSbopSec: 13825.75 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEU', takeoffAirport: 'AYT', landingAirport: 'FRA', pfdTurn1: 100, durationDerivativeSec: 2.25, durationExtTo99Sec: 1.75, pfdTurn1Deg: 46.3, pfeTo99Deg: 46.3, landingDist30Knot: 1755.067, landingDist50Knot: 1545.29, gsAtAutoSbopSec: 13347.75 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEU', takeoffAirport: 'BLL', landingAirport: 'AYT', pfdTurn1: 99.8212, durationDerivativeSec: 2.25, durationExtTo99Sec: 1.75, pfdTurn1Deg: 46.3, pfeTo99Deg: 46.3, landingDist30Knot: 1869.689, landingDist50Knot: 1622.04, gsAtAutoSbopSec: 12996.75 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEU', takeoffAirport: 'FRA', landingAirport: 'AYT', pfdTurn1: 99.8212, durationDerivativeSec: 1.75, durationExtTo99Sec: 1.25, pfdTurn1Deg: 46.3, pfeTo99Deg: 46.3, landingDist30Knot: 1324.611, landingDist50Knot: 1151.765, gsAtAutoSbopSec: 11886.25 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEY', takeoffAirport: 'ADB', landingAirport: 'MUC', pfdTurn1: 99.8215, durationDerivativeSec: 2.75, durationExtTo99Sec: 2.25, pfdTurn1Deg: 46.3, pfeTo99Deg: 46.3, landingDist30Knot: 1301.644, landingDist50Knot: 1039.48, gsAtAutoSbopSec: 9708.25 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEY', takeoffAirport: 'AYT', landingAirport: 'WAW', pfdTurn1: 99.6424, durationDerivativeSec: 2.25, durationExtTo99Sec: 1.75, pfdTurn1Deg: 46.2, pfeTo99Deg: 46.1, landingDist30Knot: 1576.613, landingDist50Knot: 1414.411, gsAtAutoSbopSec: 10880.25 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEY', takeoffAirport: 'MUC', landingAirport: 'AYT', pfdTurn1: 100, durationDerivativeSec: 2.25, durationExtTo99Sec: 1.75, pfdTurn1Deg: 46.5, pfeTo99Deg: 46.4, landingDist30Knot: 1714.835, landingDist50Knot: 1439.305, gsAtAutoSbopSec: 10576.25 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEY', takeoffAirport: 'WAW', landingAirport: 'AYT', pfdTurn1: 100, durationDerivativeSec: 2.25, durationExtTo99Sec: 1.75, pfdTurn1Deg: 46.4, pfeTo99Deg: 46.3, landingDist30Knot: 1359.067, landingDist50Knot: 1142.276, gsAtAutoSbopSec: 10222.75 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SEZ', takeoffAirport: 'NUE', landingAirport: 'AYT', pfdTurn1: 99.8206, durationDerivativeSec: 1.75, durationExtTo99Sec: 1.25, pfdTurn1Deg: 46.1, pfeTo99Deg: 46, landingDist30Knot: 1356.131, landingDist50Knot: 1189.732, gsAtAutoSbopSec: 10811.25 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMA', takeoffAirport: 'DLM', landingAirport: 'DUS', pfdTurn1: 100, durationDerivativeSec: 1.9375, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1292.415, landingDist50Knot: 1033.812, gsAtAutoSbopSec: 12818.063 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMA', takeoffAirport: 'DUS', landingAirport: 'DLM', pfdTurn1: 100, durationDerivativeSec: 1.9375, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1560.196, landingDist50Knot: 1209.644, gsAtAutoSbopSec: 12065.063 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMB', takeoffAirport: 'AYT', landingAirport: 'BRE', pfdTurn1: 100, durationDerivativeSec: 1.9375, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1649.001, landingDist50Knot: 1522.168, gsAtAutoSbopSec: 12626.563 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMB', takeoffAirport: 'AYT', landingAirport: 'FRA', pfdTurn1: 100, durationDerivativeSec: 1.9375, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 2326.568, landingDist50Knot: 2045.796, gsAtAutoSbopSec: 12833.563 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMB', takeoffAirport: 'BRE', landingAirport: 'AYT', pfdTurn1: 100, durationDerivativeSec: 1.8125, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1750.103, landingDist50Knot: 1262.932, gsAtAutoSbopSec: 11682.563 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMB', takeoffAirport: 'FRA', landingAirport: 'AYT', pfdTurn1: 100, durationDerivativeSec: 1.875, durationExtTo99Sec: 1.375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1390.162, landingDist50Knot: 1247.861, gsAtAutoSbopSec: 11103.625 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMD', takeoffAirport: 'AYT', landingAirport: 'BER', pfdTurn1: 100, durationDerivativeSec: 1.9375, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1989.678, landingDist50Knot: 1770.901, gsAtAutoSbopSec: 11958.063 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMD', takeoffAirport: 'AYT', landingAirport: 'FRA', pfdTurn1: 100, durationDerivativeSec: 1.875, durationExtTo99Sec: 1.375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1591.45, landingDist50Knot: 1148.844, gsAtAutoSbopSec: 12400.625 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMD', takeoffAirport: 'BER', landingAirport: 'SZF', pfdTurn1: 100, durationDerivativeSec: 1.9375, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1819.311, landingDist50Knot: 1386.599, gsAtAutoSbopSec: 10699.063 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMD', takeoffAirport: 'FRA', landingAirport: 'AYT', pfdTurn1: 100, durationDerivativeSec: 1.875, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1573.695, landingDist50Knot: 1188.472, gsAtAutoSbopSec: 12012.063 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SME', takeoffAirport: 'AYT', landingAirport: 'CGN', pfdTurn1: 100, durationDerivativeSec: 1.9375, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1794.303, landingDist50Knot: 1451.761, gsAtAutoSbopSec: 13134.063 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SME', takeoffAirport: 'AYT', landingAirport: 'FMO', pfdTurn1: 100, durationDerivativeSec: 1.9375, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1380.136, landingDist50Knot: 1142.77, gsAtAutoSbopSec: 12809.563 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SME', takeoffAirport: 'CGN', landingAirport: 'AYT', pfdTurn1: 100, durationDerivativeSec: 1.9375, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1774.674, landingDist50Knot: 1253.021, gsAtAutoSbopSec: 11639.063 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SME', takeoffAirport: 'FMO', landingAirport: 'AYT', pfdTurn1: 100, durationDerivativeSec: 2.3125, durationExtTo99Sec: 1.8125, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1540.123, landingDist50Knot: 1204.228, gsAtAutoSbopSec: 11674.188 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMF', takeoffAirport: 'DLM', landingAirport: 'GLA', pfdTurn1: 100, durationDerivativeSec: 1.875, durationExtTo99Sec: 1.375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1559.568, landingDist50Knot: 935.466, gsAtAutoSbopSec: 17076.625 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMF', takeoffAirport: 'DLM', landingAirport: 'STN', pfdTurn1: 100, durationDerivativeSec: 1.9375, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1309.363, landingDist50Knot: 1110.076, gsAtAutoSbopSec: 14767.063 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMF', takeoffAirport: 'GLA', landingAirport: 'DLM', pfdTurn1: 100, durationDerivativeSec: 1.75, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 47.6, landingDist30Knot: 1416.773, landingDist50Knot: 1009.617, gsAtAutoSbopSec: 15619.938 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMF', takeoffAirport: 'STN', landingAirport: 'DLM', pfdTurn1: 100, durationDerivativeSec: 1.875, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1517.493, landingDist50Knot: 1265.246, gsAtAutoSbopSec: 13561.063 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMI', takeoffAirport: 'AYT', landingAirport: 'HAJ', pfdTurn1: 100, durationDerivativeSec: 1.9375, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1042.269, landingDist50Knot: 959.555, gsAtAutoSbopSec: 12435.063 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMI', takeoffAirport: 'AYT', landingAirport: 'STR', pfdTurn1: 100, durationDerivativeSec: 1.875, durationExtTo99Sec: 1.375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1377.613, landingDist50Knot: 1119.241, gsAtAutoSbopSec: 12012.625 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMI', takeoffAirport: 'BER', landingAirport: 'AYT', pfdTurn1: 100, durationDerivativeSec: 1.9375, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1743.064, landingDist50Knot: 1245.557, gsAtAutoSbopSec: 11007.563 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMI', takeoffAirport: 'GZT', landingAirport: 'BER', pfdTurn1: 100, durationDerivativeSec: 1.9375, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1095.725, landingDist50Knot: 982.413, gsAtAutoSbopSec: 12998.563 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMI', takeoffAirport: 'HAJ', landingAirport: 'AYT', pfdTurn1: 100, durationDerivativeSec: 1.9375, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1410.392, landingDist50Knot: 1160.925, gsAtAutoSbopSec: 11714.063 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMI', takeoffAirport: 'STR', landingAirport: 'AYT', pfdTurn1: 100, durationDerivativeSec: 1.9375, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1321.576, landingDist50Knot: 1169.175, gsAtAutoSbopSec: 10626.063 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMJ', takeoffAirport: 'ADB', landingAirport: 'AYT', pfdTurn1: 100, durationDerivativeSec: 1.875, durationExtTo99Sec: 1.375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1354.47, landingDist50Knot: 1055.852, gsAtAutoSbopSec: 3236.625 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMJ', takeoffAirport: 'ADB', landingAirport: 'BER', pfdTurn1: 100, durationDerivativeSec: 1.75, durationExtTo99Sec: 1.25, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1477, landingDist50Knot: 1306.821, gsAtAutoSbopSec: 11318.25 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMJ', takeoffAirport: 'ADB', landingAirport: 'MQM', pfdTurn1: 100, durationDerivativeSec: 1.875, durationExtTo99Sec: 1.375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1497.683, landingDist50Knot: 1151.776, gsAtAutoSbopSec: 6396.625 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMJ', takeoffAirport: 'BER', landingAirport: 'ADB', pfdTurn1: 100, durationDerivativeSec: 1.875, durationExtTo99Sec: 1.375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1318.4, landingDist50Knot: 1194.763, gsAtAutoSbopSec: 9984.625 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMJ', takeoffAirport: 'MQM', landingAirport: 'ADB', pfdTurn1: 100, durationDerivativeSec: 1.875, durationExtTo99Sec: 1.375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1588.45, landingDist50Knot: 1335.122, gsAtAutoSbopSec: 7505.125 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMK', takeoffAirport: 'AYT', landingAirport: 'BSL', pfdTurn1: 100, durationDerivativeSec: 1.9375, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1741.711, landingDist50Knot: 1382.218, gsAtAutoSbopSec: 12568.063 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMK', takeoffAirport: 'AYT', landingAirport: 'HAM', pfdTurn1: 100, durationDerivativeSec: 2.25, durationExtTo99Sec: 1.8125, pfdTurn1Deg: 48, pfeTo99Deg: 47.6, landingDist30Knot: 1312.863, landingDist50Knot: 1234.19, gsAtAutoSbopSec: 13261.625 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMK', takeoffAirport: 'BSL', landingAirport: 'AYT', pfdTurn1: 100, durationDerivativeSec: 1.9375, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1444.717, landingDist50Knot: 1311.8, gsAtAutoSbopSec: 11112.563 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMK', takeoffAirport: 'HAM', landingAirport: 'AYT', pfdTurn1: 100, durationDerivativeSec: 1.9375, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1405.537, landingDist50Knot: 1223.372, gsAtAutoSbopSec: 12017.063 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SML', takeoffAirport: 'ADB', landingAirport: 'AMS', pfdTurn1: 100, durationDerivativeSec: 1.875, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 47.6, landingDist30Knot: 1917.862, landingDist50Knot: 1917.862, gsAtAutoSbopSec: 11857.625 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SML', takeoffAirport: 'ADB', landingAirport: 'FRA', pfdTurn1: 100, durationDerivativeSec: 2.125, durationExtTo99Sec: 1.6875, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1455.205, landingDist50Knot: 1162.999, gsAtAutoSbopSec: 10878.313 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SML', takeoffAirport: 'AMS', landingAirport: 'ADB', pfdTurn1: 100, durationDerivativeSec: 1.9375, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1686.202, landingDist50Knot: 1638.081, gsAtAutoSbopSec: 11260.063 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SML', takeoffAirport: 'FRA', landingAirport: 'ADB', pfdTurn1: 100, durationDerivativeSec: 2.125, durationExtTo99Sec: 1.6875, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1334.956, landingDist50Knot: 1197.239, gsAtAutoSbopSec: 10252.813 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMN', takeoffAirport: 'ADB', landingAirport: 'GZT', pfdTurn1: 100, durationDerivativeSec: 1.875, durationExtTo99Sec: 1.375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 2211.467, landingDist50Knot: 2088.002, gsAtAutoSbopSec: 5451.125 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMN', takeoffAirport: 'ADB', landingAirport: 'ZRH', pfdTurn1: 100, durationDerivativeSec: 1.9375, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 2165.504, landingDist50Knot: 1600.63, gsAtAutoSbopSec: 10100.563 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMN', takeoffAirport: 'CGN', landingAirport: 'ADB', pfdTurn1: 100, durationDerivativeSec: 1.9375, durationExtTo99Sec: 1.4375, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1433.487, landingDist50Knot: 1240.654, gsAtAutoSbopSec: 10552.063 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMN', takeoffAirport: 'GZT', landingAirport: 'ADB', pfdTurn1: 100, durationDerivativeSec: 2.1875, durationExtTo99Sec: 1.75, pfdTurn1Deg: 48, pfeTo99Deg: 48, landingDist30Knot: 1484.017, landingDist50Knot: 1208.076, gsAtAutoSbopSec: 6906.75 },
  { flightDate: '8.04.2025', tailNumber: 'TC-SMN', takeoffAirport: 'ZRH', landingAirport: 'ADB', pfdTurn1: 100, durationDerivativeSec: 2.1875, durationExtTo99Sec: 1.8125, pfdTurn1Deg: 48, pfeTo99Deg: 47.7, landingDist30Knot: 1284.716, landingDist50Knot: 1205.344, gsAtAutoSbopSec: 9459.625 },
];

export function getAircraftType(tail: string): 'NG' | 'MAX' {
  // TC-SE* prefix = 737 NG, TC-SM* prefix = 737 MAX
  if (tail.startsWith('TC-SE')) return 'NG';
  if (tail.startsWith('TC-SM')) return 'MAX';
  return 'NG';
}

export function getAllFlights(): FlightRecord[] {
  return rawData;
}

export function getUniqueTails(): string[] {
  return [...new Set(rawData.map(r => r.tailNumber))].sort();
}

export function getFlightsByTail(tail: string): FlightRecord[] {
  return rawData.filter(r => r.tailNumber === tail);
}

function computeStats(values: number[]): { mean: number; std: number } {
  const n = values.length;
  if (n === 0) return { mean: 0, std: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
  return { mean, std: Math.sqrt(variance) };
}

export function detectAnomalies(): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const allPfd = rawData.map(r => r.pfdTurn1);
  const allDurDeriv = rawData.map(r => r.durationDerivativeSec);
  const allDurExt = rawData.map(r => r.durationExtTo99Sec);
  const allDeg1 = rawData.map(r => r.pfdTurn1Deg);
  const allDeg99 = rawData.map(r => r.pfeTo99Deg);
  const allDist30 = rawData.map(r => r.landingDist30Knot);
  const allDist50 = rawData.map(r => r.landingDist50Knot);
  const allGs = rawData.map(r => r.gsAtAutoSbopSec);

  const statsPfd = computeStats(allPfd);
  const statsDurDeriv = computeStats(allDurDeriv);
  const statsDurExt = computeStats(allDurExt);
  const statsDeg1 = computeStats(allDeg1);
  const statsDeg99 = computeStats(allDeg99);
  const statsDist30 = computeStats(allDist30);
  const statsDist50 = computeStats(allDist50);
  const statsGs = computeStats(allGs);

  rawData.forEach(r => {
    const flight = `${r.tailNumber} ${r.takeoffAirport}-${r.landingAirport}`;

    // PFD Turn 1 anomaly (doubled value ~ 200)
    if (r.pfdTurn1 > statsPfd.mean + 2 * statsPfd.std) {
      anomalies.push({
        type: 'PFD Turn 1 Yüksek',
        severity: 'CRITICAL',
        description: `${flight}: PFD Turn 1 değeri ${r.pfdTurn1.toFixed(2)} — filo ortalamasının (${statsPfd.mean.toFixed(2)}) çok üzerinde. Çift speedbrake açılması veya sensör hatası olabilir.`,
        value: r.pfdTurn1,
        threshold: statsPfd.mean + 2 * statsPfd.std,
        flight,
      });
    }

    // Duration derivative anomaly
    if (r.durationDerivativeSec > statsDurDeriv.mean + 2 * statsDurDeriv.std) {
      anomalies.push({
        type: 'Açılma Süresi Yüksek',
        severity: 'WARNING',
        description: `${flight}: Türev tabanlı açılma süresi ${r.durationDerivativeSec.toFixed(2)}s — normal aralığın üzerinde. Speedbrake actuator yavaşlaması olabilir.`,
        value: r.durationDerivativeSec,
        threshold: statsDurDeriv.mean + 2 * statsDurDeriv.std,
        flight,
      });
    }

    // PFD Turn 1 Degree anomaly (doubled value)
    if (r.pfdTurn1Deg > statsDeg1.mean + 2 * statsDeg1.std) {
      anomalies.push({
        type: 'Açı Değeri Yüksek',
        severity: 'CRITICAL',
        description: `${flight}: PFD Turn 1 açısı ${r.pfdTurn1Deg.toFixed(1)}° — filo ortalamasının (${statsDeg1.mean.toFixed(1)}°) çok üzerinde. Speedbrake over-extension riski.`,
        value: r.pfdTurn1Deg,
        threshold: statsDeg1.mean + 2 * statsDeg1.std,
        flight,
      });
    }

    // Landing distance anomaly
    if (r.landingDist30Knot > statsDist30.mean + 2 * statsDist30.std) {
      anomalies.push({
        type: 'İniş Mesafesi Uzun',
        severity: 'WARNING',
        description: `${flight}: 30 knot iniş mesafesi ${r.landingDist30Knot.toFixed(0)}m — normalden uzun. Speedbrake etkinliği düşük olabilir.`,
        value: r.landingDist30Knot,
        threshold: statsDist30.mean + 2 * statsDist30.std,
        flight,
      });
    }

    if (r.landingDist50Knot > statsDist50.mean + 2 * statsDist50.std) {
      anomalies.push({
        type: 'İniş Mesafesi (50kn) Uzun',
        severity: 'WARNING',
        description: `${flight}: 50 knot iniş mesafesi ${r.landingDist50Knot.toFixed(0)}m — normalden uzun.`,
        value: r.landingDist50Knot,
        threshold: statsDist50.mean + 2 * statsDist50.std,
        flight,
      });
    }

    // GS at Auto SBOP anomaly (very high or very low)
    if (r.gsAtAutoSbopSec > statsGs.mean + 2 * statsGs.std) {
      anomalies.push({
        type: 'GS Auto SBOP Geç',
        severity: 'WARNING',
        description: `${flight}: GS Auto Speedbrake zamanı ${r.gsAtAutoSbopSec.toFixed(0)}s — geç aktivasyon. Otomatik speedbrake sistemi gecikmeli.`,
        value: r.gsAtAutoSbopSec,
        threshold: statsGs.mean + 2 * statsGs.std,
        flight,
      });
    }
    if (r.gsAtAutoSbopSec < statsGs.mean - 2 * statsGs.std) {
      anomalies.push({
        type: 'GS Auto SBOP Erken',
        severity: 'INFO',
        description: `${flight}: GS Auto Speedbrake zamanı ${r.gsAtAutoSbopSec.toFixed(0)}s — erken aktivasyon. Kısa mesafe uçuşu olabilir.`,
        value: r.gsAtAutoSbopSec,
        threshold: statsGs.mean - 2 * statsGs.std,
        flight,
      });
    }

    // Duration difference check (derivative vs ext to 99)
    const durDiff = r.durationDerivativeSec - r.durationExtTo99Sec;
    if (durDiff > 1.0) {
      anomalies.push({
        type: 'Süre Tutarsızlığı',
        severity: 'WARNING',
        description: `${flight}: Türev süresi (${r.durationDerivativeSec}s) ile 99% ext süresi (${r.durationExtTo99Sec}s) arasında ${durDiff.toFixed(2)}s fark var. Sensör kalibrasyonu kontrol edilmeli.`,
        value: durDiff,
        threshold: 1.0,
        flight,
      });
    }
  });

  return anomalies;
}

export function computeAircraftHealth(): AircraftHealth[] {
  const tails = getUniqueTails();
  const allAnomalies = detectAnomalies();

  return tails.map(tail => {
    const flights = getFlightsByTail(tail);
    const n = flights.length;
    const type = getAircraftType(tail);

    const avgPfd = flights.reduce((s, f) => s + f.pfdTurn1, 0) / n;
    const avgDurDeriv = flights.reduce((s, f) => s + f.durationDerivativeSec, 0) / n;
    const avgDurExt = flights.reduce((s, f) => s + f.durationExtTo99Sec, 0) / n;
    const avgDeg1 = flights.reduce((s, f) => s + f.pfdTurn1Deg, 0) / n;
    const avgDeg99 = flights.reduce((s, f) => s + f.pfeTo99Deg, 0) / n;
    const avgDist30 = flights.reduce((s, f) => s + f.landingDist30Knot, 0) / n;
    const avgDist50 = flights.reduce((s, f) => s + f.landingDist50Knot, 0) / n;
    const avgGs = flights.reduce((s, f) => s + f.gsAtAutoSbopSec, 0) / n;

    const tailAnomalies = allAnomalies.filter(a => a.flight?.startsWith(tail));
    const criticalCount = tailAnomalies.filter(a => a.severity === 'CRITICAL').length;
    const warningCount = tailAnomalies.filter(a => a.severity === 'WARNING').length;

    // Health score: 100 base, deductions for anomalies
    let score = 100;
    score -= criticalCount * 15;
    score -= warningCount * 5;

    // Penalize if PFD significantly off 100
    const pfdDeviation = Math.abs(avgPfd - 100);
    if (pfdDeviation > 0.5) score -= pfdDeviation * 2;

    // Penalize high duration
    if (avgDurDeriv > 2.5) score -= (avgDurDeriv - 2.5) * 10;

    score = Math.max(0, Math.min(100, score));

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (score < 50) riskLevel = 'CRITICAL';
    else if (score < 70) riskLevel = 'HIGH';
    else if (score < 85) riskLevel = 'MEDIUM';

    return {
      tailNumber: tail,
      aircraftType: type,
      totalFlights: n,
      avgPfdTurn1: avgPfd,
      avgDurationDerivative: avgDurDeriv,
      avgDurationExtTo99: avgDurExt,
      avgPfdTurn1Deg: avgDeg1,
      avgPfeTo99Deg: avgDeg99,
      avgLandingDist30: avgDist30,
      avgLandingDist50: avgDist50,
      avgGsAtAutoSbop: avgGs,
      healthScore: Math.round(score * 10) / 10,
      riskLevel,
      anomalies: tailAnomalies,
    };
  });
}

export function getFieldDescriptions(): Record<string, string> {
  return {
    'PFD Turn 1 (%)': 'Speedbrake Percent Full Deployment — Turn 1. İlk hareket emrinden sonra hedefe ulaşma yüzdesi. ~100 normal, 200 çift panel açılma şüphesi.',
    'Duration Derivative (s)': 'Türev tabanlı açılma süresi. Speedbrake\'ın hareket hızının türevinden hesaplanan süre. Düşük = hızlı yanıt.',
    'Duration Ext to 99% (s)': 'Speedbrake\'ın %99 açılma pozisyonuna ulaşma süresi. Uzun süre = actuator yavaşlaması veya hidrolik basınç düşüklüğü.',
    'PFD Turn 1 Açısı (°)': 'İlk hareket açısı (derece). Tek panel ~46-48°, çift panel ~92° civarı beklenebilir.',
    'PFE to 99% Açısı (°)': 'Speedbrake\'ın %99 konumundaki açı değeri. PFD Turn 1 açısına yakın olmalı.',
    'İniş Mesafesi 30kn (m)': 'Uçak 30 knot hıza düşene kadar geçen mesafe. Speedbrake performansından etkilenir.',
    'İniş Mesafesi 50kn (m)': 'Uçak 50 knot hıza düşene kadar geçen mesafe.',
    'GS at Auto SBOP (s)': 'Ground spoiler otomatik açılma zamanı (touchdown\'dan itibaren). Çok yüksek = geç açılma, çok düşük = kısa mesafe.',
  };
}
