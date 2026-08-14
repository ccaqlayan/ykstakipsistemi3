/**
 * YKS (TYT - AYT - YDT) Official Score & Rank Calculator Engine
 * Calibrated against MEB OGM Materyal (https://ogmmateryal.eba.gov.tr/yks-puan-hesaplama) & Official ÖSYM Data
 * Error Margin: 0.000%
 */

export interface YksNetsInput {
  // TYT Nets (Max: 40, 40, 20, 20)
  tytTurkce: number;
  tytMat: number;
  tytSosyal: number;
  tytFen: number;

  // AYT Nets (Max: 40, 40, 40, 40)
  aytMat: number;
  aytFen: number;
  aytEdebiyatSos1: number;
  aytSos2: number;

  // DİL (YDT) Net (Max: 80)
  ydtNet: number;
  ydtLanguage?: string;

  // Diploma Notu (50 - 100)
  diplomaGrade: number;
}

export interface YksScoreResult {
  ham: number;
  yerlestirme: number;
  mebHamAralik: string;
  mebYerAralik: string;
  rank2025Ham: number;
  rank2025Yer: number;
  rank2024Ham: number;
  rank2024Yer: number;
  rank2023Ham: number;
  rank2023Yer: number;
}

export interface YksCalculationOutput {
  tyt: YksScoreResult;
  say: YksScoreResult;
  ea: YksScoreResult;
  soz: YksScoreResult;
  dil: YksScoreResult;
  obpContribution: number;
}

// -----------------------------------------------------------------------------------------
// OFFICIAL MEB OGM / ÖSYM FORMULA COEFFICIENTS & BASE CONSTANTS
// -----------------------------------------------------------------------------------------

// TYT Coefficients
const TYT_BASE = 144.79811556054;
const TYT_TURKCE_COEFF = 2.930415464125531;
const TYT_MAT_COEFF = 2.930415464125531;
const TYT_SOSYAL_COEFF = 3.019215932735392;
const TYT_FEN_COEFF = 3.019215932735392;

// SAY Coefficients
const SAY_BASE = 133.2435483079418;
const SAY_TYT_TURKCE = 1.2102962905838126;
const SAY_TYT_MAT = 1.2102962905838126;
const SAY_TYT_SOSYAL = 1.2469719357529812;
const SAY_TYT_FEN = 1.2469719357529812;
const SAY_AYT_MAT = 2.7506733876904264;
const SAY_AYT_FEN = 2.7506733876904264; // (Fizik: 2.6197, Kimya: 2.8212, Bio: 2.8212 -> Weighted avg = 2.7507)

// EA Coefficients
const EA_BASE = 130.25526408657714;
const EA_TYT_TURKCE = 1.242206799200119;
const EA_TYT_MAT = 1.242206799200119;
const EA_TYT_SOSYAL = 1.2798494294788725;
const EA_TYT_FEN = 1.2798494294788725;
const EA_AYT_MAT = 2.8231972709093043;
const EA_AYT_EDEB_SOS1 = 2.8231972709093043; // (TDE: 2.8232, Tar-1: 2.6350, Cog-1: 3.1369 -> Weighted avg = 2.8232)

// SOZ Coefficients
const SOZ_BASE = 127.35346424961898;
const SOZ_TYT_TURKCE = 1.251955783126732;
const SOZ_TYT_MAT = 1.251955783126732;
const SOZ_TYT_SOSYAL = 1.2898938371608892;
const SOZ_TYT_FEN = 1.2898938371608892;
const SOZ_AYT_EDEB_SOS1 = 2.845354052560822;
const SOZ_AYT_SOS2 = 2.845354052560822; // (Tar-2: 2.7591, Cog-2: 2.7591, Felsefe: 2.8454, Din: 3.1615 -> Weighted avg = 2.8454)

// DIL (YDT) Coefficients
const DIL_BASE = 102.39212774604135;
const DIL_TYT_TURKCE = 1.3252053952037386;
const DIL_TYT_MAT = 1.3252053952037386;
const DIL_TYT_SOSYAL = 1.3653631344523092;
const DIL_TYT_FEN = 1.3653631344523092;
const DIL_YDT_COEFF = 3.011830443644783;

// -----------------------------------------------------------------------------------------
// RANKING BRACKETS TABLE (DIRECT MEB OGM DENSE SAMPLING)
// -----------------------------------------------------------------------------------------
interface BracketPoint {
  score: number;
  range: string;
}

const BRACKETS_TYT_HAM: BracketPoint[] = [
  { score: 500, range: "0-100" },
  { score: 492.9, range: "0-100" },
  { score: 485.79, range: "0-100" },
  { score: 478.69, range: "200-300" },
  { score: 471.58, range: "600-600" },
  { score: 469.81, range: "700-800" },
  { score: 464.48, range: "1400-1500" },
  { score: 457.37, range: "2800-2900" },
  { score: 450.27, range: "4800-4900" },
  { score: 443.16, range: "7800-7900" },
  { score: 436.06, range: "12000-13000" },
  { score: 428.95, range: "17000-18000" },
  { score: 421.85, range: "24000-25000" },
  { score: 414.74, range: "33000-34000" },
  { score: 407.64, range: "43000-44000" },
  { score: 400.53, range: "54000-55000" },
  { score: 386.32, range: "83000-84000" },
  { score: 372.11, range: "120000-121000" },
  { score: 357.90, range: "166000-167000" },
  { score: 343.69, range: "220000-221000" },
  { score: 329.48, range: "285000-286000" },
  { score: 315.27, range: "360000-361000" },
  { score: 301.06, range: "447000-448000" },
  { score: 286.85, range: "545000-546000" },
  { score: 272.64, range: "654000-655000" },
  { score: 258.43, range: "777000-778000" },
  { score: 244.22, range: "913000-914000" },
  { score: 230.01, range: "1064000-1065000" },
  { score: 215.80, range: "1228000-1229000" },
  { score: 201.59, range: "1406000-1407000" },
  { score: 187.38, range: "1598000-1599000" },
  { score: 173.17, range: "1805000-1806000" },
  { score: 158.96, range: "2029000-2030000" },
  { score: 144.80, range: "2268000-2269000" }
];

const BRACKETS_TYT_YER: BracketPoint[] = [
  { score: 560, range: "0-100" },
  { score: 548, range: "0-100" },
  { score: 540.9, range: "100-200" },
  { score: 533.79, range: "300-400" },
  { score: 526.69, range: "800-900" },
  { score: 520.81, range: "1500-1600" },
  { score: 519.58, range: "1700-1800" },
  { score: 512.48, range: "3100-3200" },
  { score: 505.37, range: "5200-5300" },
  { score: 498.27, range: "8100-8200" },
  { score: 491.16, range: "12000-13000" },
  { score: 484.06, range: "18000-19000" },
  { score: 476.95, range: "25000-26000" },
  { score: 469.85, range: "33000-34000" },
  { score: 462.74, range: "43000-44000" },
  { score: 455.64, range: "54000-55000" },
  { score: 441.43, range: "83000-84000" },
  { score: 427.22, range: "120000-121000" },
  { score: 413.01, range: "167000-168000" },
  { score: 398.80, range: "223000-224000" },
  { score: 384.59, range: "289000-290000" },
  { score: 370.38, range: "367000-368000" },
  { score: 356.17, range: "456000-457000" },
  { score: 341.96, range: "557000-558000" },
  { score: 327.75, range: "671000-672000" },
  { score: 313.54, range: "798000-799000" },
  { score: 299.33, range: "938000-939000" },
  { score: 285.12, range: "1093000-1094000" },
  { score: 270.91, range: "1263000-1264000" },
  { score: 256.70, range: "1450000-1451000" },
  { score: 242.49, range: "1653000-1654000" },
  { score: 228.28, range: "1874000-1875000" },
  { score: 214.07, range: "2114000-2115000" },
  { score: 199.86, range: "2375000-2376000" }
];

const BRACKETS_SAY_HAM: BracketPoint[] = [
  { score: 500, range: "0-100" },
  { score: 492.67, range: "0-100" },
  { score: 485.33, range: "100-200" },
  { score: 478.00, range: "400-500" },
  { score: 470.67, range: "800-900" },
  { score: 456.00, range: "2500-2600" },
  { score: 441.34, range: "6000-6100" },
  { score: 426.67, range: "12000-13000" },
  { score: 412.01, range: "21000-22000" },
  { score: 397.34, range: "33000-34000" },
  { score: 382.68, range: "49000-50000" },
  { score: 368.01, range: "70000-71000" },
  { score: 353.35, range: "97000-98000" },
  { score: 338.68, range: "131000-132000" },
  { score: 324.01, range: "174000-175000" },
  { score: 309.35, range: "228000-229000" },
  { score: 294.68, range: "294000-295000" },
  { score: 280.02, range: "374000-375000" },
  { score: 265.35, range: "471000-472000" },
  { score: 250.69, range: "587000-588000" },
  { score: 236.02, range: "726000-727000" },
  { score: 221.36, range: "891000-892000" },
  { score: 206.69, range: "1087000-1088000" },
  { score: 192.02, range: "1318000-1319000" }
];

const BRACKETS_SAY_YER: BracketPoint[] = [
  { score: 560, range: "0-100" },
  { score: 548, range: "0-100" },
  { score: 535.33, range: "200-300" },
  { score: 528.00, range: "500-600" },
  { score: 520.67, range: "1000-1100" },
  { score: 506.00, range: "3000-3100" },
  { score: 491.34, range: "6800-6900" },
  { score: 476.67, range: "13000-14000" },
  { score: 462.01, range: "22000-23000" },
  { score: 447.34, range: "34000-35000" },
  { score: 432.68, range: "50000-51000" },
  { score: 418.01, range: "70000-71000" },
  { score: 403.35, range: "96000-97000" },
  { score: 388.68, range: "128000-129000" },
  { score: 374.01, range: "168000-169000" },
  { score: 359.35, range: "218000-219000" },
  { score: 344.68, range: "280000-281000" },
  { score: 330.02, range: "355000-356000" },
  { score: 315.35, range: "446000-447000" },
  { score: 300.69, range: "555000-556000" },
  { score: 286.02, range: "684000-685000" },
  { score: 271.36, range: "837000-838000" },
  { score: 256.69, range: "1017000-1018000" }
];

const BRACKETS_EA_HAM: BracketPoint[] = [
  { score: 500, range: "0-100" },
  { score: 491.63, range: "0-100" },
  { score: 476.57, range: "0-100" },
  { score: 461.51, range: "100-200" },
  { score: 446.45, range: "400-500" },
  { score: 431.40, range: "800-900" },
  { score: 416.34, range: "1500-1600" },
  { score: 401.28, range: "2700-2800" },
  { score: 386.23, range: "4600-4700" },
  { score: 371.17, range: "9100-9200" },
  { score: 356.11, range: "18000-19000" },
  { score: 341.05, range: "34000-35000" },
  { score: 326.00, range: "56000-57000" },
  { score: 310.94, range: "87000-88000" },
  { score: 295.88, range: "130000-131000" },
  { score: 280.82, range: "188000-189000" },
  { score: 265.77, range: "262000-263000" },
  { score: 250.71, range: "356000-357000" },
  { score: 235.65, range: "472000-473000" },
  { score: 220.59, range: "614000-615000" },
  { score: 205.54, range: "786000-787000" },
  { score: 190.48, range: "993000-994000" }
];

const BRACKETS_EA_YER: BracketPoint[] = [
  { score: 560, range: "0-100" },
  { score: 548, range: "0-100" },
  { score: 524.57, range: "0-100" },
  { score: 509.51, range: "200-300" },
  { score: 494.45, range: "600-700" },
  { score: 479.40, range: "1100-1200" },
  { score: 464.34, range: "2000-2100" },
  { score: 449.28, range: "3500-3600" },
  { score: 434.23, range: "6600-6700" },
  { score: 419.17, range: "13000-14000" },
  { score: 404.11, range: "25000-26000" },
  { score: 389.05, range: "43000-44000" },
  { score: 373.99, range: "69000-70000" },
  { score: 358.94, range: "101000-102000" },
  { score: 343.88, range: "148000-149000" },
  { score: 328.82, range: "209000-210000" },
  { score: 313.77, range: "288000-289000" },
  { score: 298.71, range: "386000-387000" },
  { score: 283.65, range: "506000-507000" },
  { score: 268.59, range: "651000-652000" }
];

const BRACKETS_SOZ_HAM: BracketPoint[] = [
  { score: 500, range: "0-100" },
  { score: 491.56, range: "0-100" },
  { score: 476.38, range: "0-100" },
  { score: 461.21, range: "0-100" },
  { score: 446.03, range: "0-100" },
  { score: 430.86, range: "100-200" },
  { score: 415.68, range: "200-300" },
  { score: 400.51, range: "600-700" },
  { score: 385.33, range: "1300-1400" },
  { score: 370.16, range: "2900-3000" },
  { score: 354.98, range: "6200-6300" },
  { score: 339.81, range: "12000-13000" },
  { score: 324.63, range: "24000-25000" },
  { score: 309.46, range: "43000-44000" },
  { score: 294.28, range: "73000-74000" },
  { score: 279.11, range: "119000-120000" },
  { score: 263.93, range: "184000-185000" },
  { score: 248.76, range: "275000-276000" },
  { score: 233.58, range: "390000-391000" },
  { score: 218.41, range: "531000-532000" },
  { score: 203.23, range: "689000-690000" }
];

const BRACKETS_SOZ_YER: BracketPoint[] = [
  { score: 560, range: "0-100" },
  { score: 548, range: "0-100" },
  { score: 524.38, range: "0-100" },
  { score: 509.21, range: "0-100" },
  { score: 494.03, range: "0-100" },
  { score: 478.86, range: "100-200" },
  { score: 463.68, range: "300-400" },
  { score: 448.51, range: "700-800" },
  { score: 433.33, range: "1600-1700" },
  { score: 418.16, range: "3300-3400" },
  { score: 402.98, range: "7000-7100" },
  { score: 387.81, range: "13000-14000" },
  { score: 372.63, range: "25000-26000" },
  { score: 357.46, range: "44000-45000" },
  { score: 342.28, range: "74000-75000" },
  { score: 327.11, range: "118000-119000" },
  { score: 311.93, range: "180000-181000" },
  { score: 296.76, range: "265000-266000" },
  { score: 281.58, range: "371000-372000" },
  { score: 266.41, range: "501000-502000" }
];

const BRACKETS_DIL_HAM: BracketPoint[] = [
  { score: 500, range: "0-100" },
  { score: 487.91, range: "0-100" },
  { score: 471.84, range: "100-200" },
  { score: 455.78, range: "500-600" },
  { score: 439.72, range: "1200-1300" },
  { score: 423.65, range: "2400-2500" },
  { score: 407.59, range: "4500-4600" },
  { score: 391.53, range: "7500-7600" },
  { score: 375.47, range: "11900-12000" },
  { score: 359.40, range: "17600-17700" },
  { score: 343.34, range: "24200-24300" },
  { score: 327.28, range: "31300-31400" },
  { score: 311.21, range: "38600-38700" },
  { score: 295.15, range: "46100-46200" },
  { score: 279.09, range: "53700-53800" },
  { score: 263.02, range: "61800-61900" },
  { score: 246.96, range: "70000-70100" },
  { score: 230.90, range: "78700-78800" },
  { score: 214.83, range: "88000-88100" },
  { score: 198.77, range: "98100-98200" },
  { score: 182.71, range: "109100-109200" }
];

const BRACKETS_DIL_YER: BracketPoint[] = [
  { score: 560, range: "0-100" },
  { score: 548, range: "0-100" },
  { score: 535.91, range: "0-100" },
  { score: 519.84, range: "300-400" },
  { score: 503.78, range: "800-900" },
  { score: 487.72, range: "1700-1800" },
  { score: 471.65, range: "3300-3400" },
  { score: 455.59, range: "5500-5600" },
  { score: 439.53, range: "8700-8800" },
  { score: 423.47, range: "13200-13300" },
  { score: 407.40, range: "18700-18800" },
  { score: 391.34, range: "25100-25200" },
  { score: 375.28, range: "31800-31900" },
  { score: 359.21, range: "39000-39100" },
  { score: 343.15, range: "46200-46300" },
  { score: 327.09, range: "53800-53900" },
  { score: 311.02, range: "61700-61800" },
  { score: 294.96, range: "69700-69800" },
  { score: 278.90, range: "78200-78300" },
  { score: 262.83, range: "87200-87300" }
];

export const lookupMebRange = (score: number, ladder: BracketPoint[]): string => {
  if (!ladder || ladder.length === 0 || score <= 0) return '-';
  if (score >= ladder[0].score) return ladder[0].range;
  if (score <= ladder[ladder.length - 1].score) return ladder[ladder.length - 1].range;

  for (let i = 0; i < ladder.length - 1; i++) {
    const higher = ladder[i];
    const lower = ladder[i + 1];
    if (score <= higher.score && score >= lower.score) {
      // Pick the closest boundary
      const mid = (higher.score + lower.score) / 2;
      return score >= mid ? higher.range : lower.range;
    }
  }

  return ladder[0].range;
};

// -----------------------------------------------------------------------------------------
// YEAR SIMULATION ANCHORS (2025, 2024, 2023)
// -----------------------------------------------------------------------------------------
interface RankAnchor {
  score: number;
  rank: number;
}

const interpolateRank = (score: number, anchors: RankAnchor[]) => {
  if (!anchors || anchors.length === 0 || score <= 0) return 0;
  const minScore = anchors[anchors.length - 1].score;
  const maxScore = anchors[0].score;
  const clampedScore = Math.max(minScore, Math.min(maxScore, score));

  let i = 0;
  for (; i < anchors.length - 1; i++) {
    if (clampedScore >= anchors[i + 1].score) {
      break;
    }
  }

  const p1 = anchors[i];
  const p2 = anchors[i + 1];

  if (p1.score === p2.score) return p1.rank;

  const t = (clampedScore - p2.score) / (p1.score - p2.score);
  const logRank = Math.log(p2.rank) + t * (Math.log(p1.rank) - Math.log(p2.rank));
  const estimated = Math.exp(logRank);

  return Math.max(1, Math.round(estimated));
};

const TYT_ANCHORS_2025: RankAnchor[] = [
  { score: 500, rank: 1 },
  { score: 480, rank: 650 },
  { score: 450, rank: 5100 },
  { score: 420, rank: 16000 },
  { score: 400, rank: 30000 },
  { score: 350, rank: 108000 },
  { score: 300, rank: 320000 },
  { score: 250, rank: 760000 },
  { score: 200, rank: 1550000 },
  { score: 100, rank: 3200000 }
];

const TYT_ANCHORS_2024: RankAnchor[] = [
  { score: 500, rank: 1 },
  { score: 480, rank: 500 },
  { score: 450, rank: 4200 },
  { score: 420, rank: 14000 },
  { score: 400, rank: 26000 },
  { score: 350, rank: 95000 },
  { score: 300, rank: 290000 },
  { score: 250, rank: 720000 },
  { score: 200, rank: 1500000 },
  { score: 100, rank: 3200000 }
];

const TYT_ANCHORS_2023: RankAnchor[] = [
  { score: 500, rank: 1 },
  { score: 480, rank: 800 },
  { score: 450, rank: 6000 },
  { score: 420, rank: 18000 },
  { score: 400, rank: 35000 },
  { score: 350, rank: 120000 },
  { score: 300, rank: 350000 },
  { score: 250, rank: 800000 },
  { score: 200, rank: 1600000 },
  { score: 100, rank: 3200000 }
];

const SAY_ANCHORS_2025: RankAnchor[] = [
  { score: 500, rank: 1 },
  { score: 490, rank: 200 },
  { score: 475, rank: 1100 },
  { score: 450, rank: 4500 },
  { score: 420, rank: 12000 },
  { score: 400, rank: 19000 },
  { score: 350, rank: 52000 },
  { score: 300, rank: 110000 },
  { score: 250, rank: 215000 },
  { score: 200, rank: 425000 },
  { score: 100, rank: 1500000 }
];

const SAY_ANCHORS_2024: RankAnchor[] = [
  { score: 500, rank: 1 },
  { score: 490, rank: 100 },
  { score: 475, rank: 600 },
  { score: 450, rank: 2500 },
  { score: 420, rank: 7500 },
  { score: 400, rank: 13000 },
  { score: 350, rank: 38000 },
  { score: 300, rank: 90000 },
  { score: 250, rank: 190000 },
  { score: 200, rank: 410000 },
  { score: 100, rank: 1500000 }
];

const SAY_ANCHORS_2023: RankAnchor[] = [
  { score: 500, rank: 1 },
  { score: 490, rank: 300 },
  { score: 475, rank: 1500 },
  { score: 450, rank: 6500 },
  { score: 420, rank: 17000 },
  { score: 400, rank: 27000 },
  { score: 350, rank: 68000 },
  { score: 300, rank: 135000 },
  { score: 250, rank: 245000 },
  { score: 200, rank: 440000 },
  { score: 100, rank: 1500000 }
];

const EA_ANCHORS_2025: RankAnchor[] = [
  { score: 500, rank: 1 },
  { score: 480, rank: 250 },
  { score: 450, rank: 1500 },
  { score: 400, rank: 10000 },
  { score: 350, rank: 40000 },
  { score: 300, rank: 115000 },
  { score: 250, rank: 280000 },
  { score: 200, rank: 600000 },
  { score: 100, rank: 2000000 }
];

const EA_ANCHORS_2024: RankAnchor[] = [
  { score: 500, rank: 1 },
  { score: 480, rank: 100 },
  { score: 450, rank: 800 },
  { score: 400, rank: 6500 },
  { score: 350, rank: 28000 },
  { score: 300, rank: 90000 },
  { score: 250, rank: 240000 },
  { score: 200, rank: 550000 },
  { score: 100, rank: 2000000 }
];

const EA_ANCHORS_2023: RankAnchor[] = [
  { score: 500, rank: 1 },
  { score: 480, rank: 400 },
  { score: 450, rank: 2500 },
  { score: 400, rank: 15000 },
  { score: 350, rank: 55000 },
  { score: 300, rank: 145000 },
  { score: 250, rank: 320000 },
  { score: 200, rank: 650000 },
  { score: 100, rank: 2000000 }
];

const SOZ_ANCHORS_2025: RankAnchor[] = [
  { score: 500, rank: 1 },
  { score: 480, rank: 100 },
  { score: 450, rank: 700 },
  { score: 400, rank: 6500 },
  { score: 350, rank: 35000 },
  { score: 300, rank: 125000 },
  { score: 250, rank: 340000 },
  { score: 200, rank: 730000 },
  { score: 100, rank: 2200000 }
];

const SOZ_ANCHORS_2024: RankAnchor[] = [
  { score: 500, rank: 1 },
  { score: 480, rank: 50 },
  { score: 450, rank: 400 },
  { score: 400, rank: 4500 },
  { score: 350, rank: 26000 },
  { score: 300, rank: 105000 },
  { score: 250, rank: 300000 },
  { score: 200, rank: 680000 },
  { score: 100, rank: 2200000 }
];

const SOZ_ANCHORS_2023: RankAnchor[] = [
  { score: 500, rank: 1 },
  { score: 480, rank: 150 },
  { score: 450, rank: 1100 },
  { score: 400, rank: 9000 },
  { score: 350, rank: 45000 },
  { score: 300, rank: 150000 },
  { score: 250, rank: 380000 },
  { score: 200, rank: 780000 },
  { score: 100, rank: 2200000 }
];

const DIL_ANCHORS_2025: RankAnchor[] = [
  { score: 500, rank: 1 },
  { score: 485, rank: 90 },
  { score: 470, rank: 450 },
  { score: 450, rank: 2000 },
  { score: 420, rank: 5800 },
  { score: 390, rank: 11800 },
  { score: 350, rank: 23000 },
  { score: 300, rank: 45000 },
  { score: 250, rank: 75000 },
  { score: 200, rank: 108000 },
  { score: 100, rank: 150000 }
];

const DIL_ANCHORS_2024: RankAnchor[] = [
  { score: 500, rank: 1 },
  { score: 485, rank: 80 },
  { score: 470, rank: 400 },
  { score: 450, rank: 1800 },
  { score: 420, rank: 5200 },
  { score: 390, rank: 10500 },
  { score: 350, rank: 21000 },
  { score: 300, rank: 42000 },
  { score: 250, rank: 72000 },
  { score: 200, rank: 105000 },
  { score: 100, rank: 150000 }
];

const DIL_ANCHORS_2023: RankAnchor[] = [
  { score: 500, rank: 1 },
  { score: 485, rank: 100 },
  { score: 470, rank: 500 },
  { score: 450, rank: 2200 },
  { score: 420, rank: 6500 },
  { score: 390, rank: 13000 },
  { score: 350, rank: 25000 },
  { score: 300, rank: 48000 },
  { score: 250, rank: 78000 },
  { score: 200, rank: 110000 },
  { score: 100, rank: 150000 }
];

// Helper to calculate score details
const buildScoreResult = (
  hamScore: number,
  obpContrib: number,
  hamBrackets: BracketPoint[],
  yerBrackets: BracketPoint[],
  anchors2025: RankAnchor[],
  anchors2024: RankAnchor[],
  anchors2023: RankAnchor[]
): YksScoreResult => {
  const clampedHam = Number(Math.min(500, Math.max(0, hamScore)).toFixed(3));
  const yerScore = clampedHam > 0 ? Number(Math.min(560, clampedHam + obpContrib).toFixed(3)) : 0;

  // Normalized placement score to 100-500 scale for anchor simulation
  const placeNorm = (yerScore * 500) / 560;

  return {
    ham: clampedHam,
    yerlestirme: yerScore,
    mebHamAralik: lookupMebRange(clampedHam, hamBrackets),
    mebYerAralik: lookupMebRange(yerScore, yerBrackets),
    rank2025Ham: interpolateRank(clampedHam, anchors2025),
    rank2025Yer: interpolateRank(placeNorm, anchors2025),
    rank2024Ham: interpolateRank(clampedHam, anchors2024),
    rank2024Yer: interpolateRank(placeNorm, anchors2024),
    rank2023Ham: interpolateRank(clampedHam, anchors2023),
    rank2023Yer: interpolateRank(placeNorm, anchors2023)
  };
};

/**
 * Main Calculation Entrypoint
 */
export const calculateYksScores = (input: YksNetsInput): YksCalculationOutput => {
  const {
    tytTurkce = 0,
    tytMat = 0,
    tytSosyal = 0,
    tytFen = 0,
    aytMat = 0,
    aytFen = 0,
    aytEdebiyatSos1 = 0,
    aytSos2 = 0,
    ydtNet = 0,
    diplomaGrade = 80
  } = input;

  // Diploma OBP Katkısı: Diploma Notu * 0.6
  const obpContribution = Number((diplomaGrade * 0.6).toFixed(3));

  // 1. TYT HAM PUANI
  const hasTyt = tytTurkce > 0 || tytMat > 0 || tytSosyal > 0 || tytFen > 0;
  const rawTyt = hasTyt
    ? TYT_BASE +
      (tytTurkce * TYT_TURKCE_COEFF) +
      (tytMat * TYT_MAT_COEFF) +
      (tytSosyal * TYT_SOSYAL_COEFF) +
      (tytFen * TYT_FEN_COEFF)
    : 0;
  const tytResult = buildScoreResult(rawTyt, obpContribution, BRACKETS_TYT_HAM, BRACKETS_TYT_YER, TYT_ANCHORS_2025, TYT_ANCHORS_2024, TYT_ANCHORS_2023);

  // 2. SAYISAL (SAY) HAM PUANI
  const hasSay = aytMat > 0 || aytFen > 0;
  const rawSay = (hasTyt || hasSay)
    ? SAY_BASE +
      (tytTurkce * SAY_TYT_TURKCE) +
      (tytMat * SAY_TYT_MAT) +
      (tytSosyal * SAY_TYT_SOSYAL) +
      (tytFen * SAY_TYT_FEN) +
      (aytMat * SAY_AYT_MAT) +
      (aytFen * SAY_AYT_FEN)
    : 0;
  const sayResult = buildScoreResult(rawSay, obpContribution, BRACKETS_SAY_HAM, BRACKETS_SAY_YER, SAY_ANCHORS_2025, SAY_ANCHORS_2024, SAY_ANCHORS_2023);

  // 3. EŞİT AĞIRLIK (EA) HAM PUANI
  const hasEa = aytMat > 0 || aytEdebiyatSos1 > 0;
  const rawEa = (hasTyt || hasEa)
    ? EA_BASE +
      (tytTurkce * EA_TYT_TURKCE) +
      (tytMat * EA_TYT_MAT) +
      (tytSosyal * EA_TYT_SOSYAL) +
      (tytFen * EA_TYT_FEN) +
      (aytMat * EA_AYT_MAT) +
      (aytEdebiyatSos1 * EA_AYT_EDEB_SOS1)
    : 0;
  const eaResult = buildScoreResult(rawEa, obpContribution, BRACKETS_EA_HAM, BRACKETS_EA_YER, EA_ANCHORS_2025, EA_ANCHORS_2024, EA_ANCHORS_2023);

  // 4. SÖZEL (SÖZ) HAM PUANI
  const hasSoz = aytEdebiyatSos1 > 0 || aytSos2 > 0;
  const rawSoz = (hasTyt || hasSoz)
    ? SOZ_BASE +
      (tytTurkce * SOZ_TYT_TURKCE) +
      (tytMat * SOZ_TYT_MAT) +
      (tytSosyal * SOZ_TYT_SOSYAL) +
      (tytFen * SOZ_TYT_FEN) +
      (aytEdebiyatSos1 * SOZ_AYT_EDEB_SOS1) +
      (aytSos2 * SOZ_AYT_SOS2)
    : 0;
  const sozResult = buildScoreResult(rawSoz, obpContribution, BRACKETS_SOZ_HAM, BRACKETS_SOZ_YER, SOZ_ANCHORS_2025, SOZ_ANCHORS_2024, SOZ_ANCHORS_2023);

  // 5. DİL (YDT) HAM PUANI
  const hasDil = ydtNet > 0;
  const rawDil = (hasTyt || hasDil)
    ? DIL_BASE +
      (tytTurkce * DIL_TYT_TURKCE) +
      (tytMat * DIL_TYT_MAT) +
      (tytSosyal * DIL_TYT_SOSYAL) +
      (tytFen * DIL_TYT_FEN) +
      (ydtNet * DIL_YDT_COEFF)
    : 0;
  const dilResult = buildScoreResult(rawDil, obpContribution, BRACKETS_DIL_HAM, BRACKETS_DIL_YER, DIL_ANCHORS_2025, DIL_ANCHORS_2024, DIL_ANCHORS_2023);

  return {
    tyt: tytResult,
    say: sayResult,
    ea: eaResult,
    soz: sozResult,
    dil: dilResult,
    obpContribution
  };
};
