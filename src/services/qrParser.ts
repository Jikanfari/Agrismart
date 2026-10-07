export type ScannedProductType = 'seed' | 'fertilizer' | 'expense' | 'unknown';

export interface ScannedSeedPayload {
  type: 'seed';
  cropName: string;
  variety: string;
  batchNumber?: string;
  germinationRate?: string;
  targetMoistureMin?: number;
  targetMoistureMax?: number;
  targetTempMin?: number;
  targetTempMax?: number;
  daysToMaturity?: number;
  cost?: number;
  vendor?: string;
  notes?: string;
}

export interface ScannedFertilizerPayload {
  type: 'fertilizer';
  fertilizerName: string;
  formulation?: string;
  quantity?: number;
  unit?: 'kg' | 'liters' | 'bags';
  applicationMethod?: 'Broadcasting' | 'Drip fertigation' | 'Foliar spray' | 'Band placement';
  cost?: number;
  vendor?: string;
  safetyNotes?: string;
}

export interface ScannedExpensePayload {
  type: 'expense';
  category: string;
  description: string;
  amount: number;
  vendor?: string;
  notes?: string;
}

export interface ScannedProductResult {
  raw: string;
  productType: ScannedProductType;
  title: string;
  summary: string;
  seedData?: ScannedSeedPayload;
  fertilizerData?: ScannedFertilizerPayload;
  expenseData?: ScannedExpensePayload;
}

export function parseAgriculturalQR(qrContent: string): ScannedProductResult {
  const trimmed = qrContent.trim();

  // Try JSON parsing
  try {
    const data = JSON.parse(trimmed);
    if (typeof data === 'object' && data !== null) {
      if (data.type === 'seed' || data.cropName) {
        const seed: ScannedSeedPayload = {
          type: 'seed',
          cropName: data.cropName || data.name || 'Unknown Crop',
          variety: data.variety || '',
          batchNumber: data.batchNumber || data.lot,
          germinationRate: data.germinationRate,
          targetMoistureMin: Number(data.targetMoistureMin) || 35,
          targetMoistureMax: Number(data.targetMoistureMax) || 75,
          targetTempMin: Number(data.targetTempMin) || 18,
          targetTempMax: Number(data.targetTempMax) || 32,
          daysToMaturity: Number(data.daysToMaturity) || 90,
          cost: Number(data.cost) || 0,
          vendor: data.vendor || '',
          notes: data.notes || '',
        };
        return {
          raw: trimmed,
          productType: 'seed',
          title: `Seed Packet: ${seed.cropName} (${seed.variety || 'Standard'})`,
          summary: `Lot: ${seed.batchNumber || 'N/A'} · Maturity: ${seed.daysToMaturity || 90} days · Germination: ${seed.germinationRate || '90%+'}`,
          seedData: seed,
        };
      }

      if (data.type === 'fertilizer' || data.fertilizerName) {
        const fert: ScannedFertilizerPayload = {
          type: 'fertilizer',
          fertilizerName: data.fertilizerName || data.name || 'Compound Fertilizer',
          formulation: data.formulation || 'NPK',
          quantity: Number(data.bagWeight || data.quantity) || 50,
          unit: (data.unit as any) || 'kg',
          applicationMethod: (data.applicationMethod as any) || 'Broadcasting',
          cost: Number(data.cost) || 0,
          vendor: data.vendor || '',
          safetyNotes: data.safetyNotes || '',
        };
        return {
          raw: trimmed,
          productType: 'fertilizer',
          title: `Fertilizer Bag: ${fert.fertilizerName}`,
          summary: `Formulation: ${fert.formulation || 'Standard'} · Net: ${fert.quantity} ${fert.unit} · Method: ${fert.applicationMethod}`,
          fertilizerData: fert,
        };
      }

      if (data.type === 'expense' || data.category) {
        const exp: ScannedExpensePayload = {
          type: 'expense',
          category: data.category || 'Equipment/Tools',
          description: data.description || data.productName || 'Agricultural Supply',
          amount: Number(data.amount || data.cost) || 0,
          vendor: data.vendor || '',
          notes: data.notes || data.targetPests || '',
        };
        return {
          raw: trimmed,
          productType: 'expense',
          title: `Input Supply: ${exp.description}`,
          summary: `Category: ${exp.category} · Cost: $${exp.amount} · Vendor: ${exp.vendor || 'N/A'}`,
          expenseData: exp,
        };
      }
    }
  } catch {
    // Not JSON, check plain text patterns
  }

  // Regex heuristics for plain text formats
  if (/seed|variety|germination|maize|tomato|cassava|pepper/i.test(trimmed)) {
    const parts = trimmed.split(/[\n,;]+/);
    return {
      raw: trimmed,
      productType: 'seed',
      title: `Scanned Seed Batch: ${parts[0] || 'Field Crop'}`,
      summary: trimmed.slice(0, 100),
      seedData: {
        type: 'seed',
        cropName: parts[0] || 'Scanned Crop',
        variety: parts[1] || 'Commercial Hybrid',
        daysToMaturity: 90,
        targetMoistureMin: 35,
        targetMoistureMax: 70,
        targetTempMin: 18,
        targetTempMax: 32,
        notes: trimmed,
      },
    };
  }

  if (/fertilizer|npk|urea|dap|potash|nitrogen/i.test(trimmed)) {
    const parts = trimmed.split(/[\n,;]+/);
    return {
      raw: trimmed,
      productType: 'fertilizer',
      title: `Scanned Fertilizer: ${parts[0] || 'NPK Fertilizer'}`,
      summary: trimmed.slice(0, 100),
      fertilizerData: {
        type: 'fertilizer',
        fertilizerName: parts[0] || 'NPK Compound',
        quantity: 50,
        unit: 'kg',
        applicationMethod: 'Broadcasting',
        cost: 45,
        safetyNotes: trimmed,
      },
    };
  }

  return {
    raw: trimmed,
    productType: 'unknown',
    title: 'Scanned QR Code',
    summary: trimmed.slice(0, 120),
  };
}

// Built-in presets for quick demo testing
export const SAMPLE_AGRICULTURAL_QR_PRESETS: { label: string; payload: string }[] = [
  {
    label: 'Hybrid Yellow Maize Seed Packet (Pioneer 30Y87)',
    payload: JSON.stringify({
      type: 'seed',
      cropName: 'Hybrid Yellow Maize',
      variety: 'Pioneer 30Y87',
      batchNumber: 'LOT-MZ-2026-99',
      germinationRate: '98%',
      daysToMaturity: 105,
      targetMoistureMin: 40,
      targetMoistureMax: 70,
      targetTempMin: 18,
      targetTempMax: 32,
      cost: 48,
      vendor: 'Pioneer Hi-Bred Agro Ltd',
      notes: 'Treated with Cruiser insecticide seed protectant. Drought tolerant.',
    }),
  },
  {
    label: 'Rio Grande Tomato Hybrid Seed Packet',
    payload: JSON.stringify({
      type: 'seed',
      cropName: 'Roma Hybrid Tomato',
      variety: 'Rio Grande High-Yield',
      batchNumber: 'LOT-TOM-4412',
      germinationRate: '94%',
      daysToMaturity: 80,
      targetMoistureMin: 45,
      targetMoistureMax: 75,
      targetTempMin: 20,
      targetTempMax: 30,
      cost: 32,
      vendor: 'East-West Seed International',
      notes: 'Determinate saladette tomato with high resistance to Verticillium wilt.',
    }),
  },
  {
    label: 'YaraMila NPK 15-15-15 50kg Fertilizer Bag',
    payload: JSON.stringify({
      type: 'fertilizer',
      fertilizerName: 'YaraMila NPK 15-15-15 + 4S Complex',
      formulation: '15-15-15 + 4S + Boron',
      bagWeight: 50,
      unit: 'kg',
      applicationMethod: 'Band placement',
      cost: 62,
      vendor: 'Yara Crop Nutrition Ltd',
      safetyNotes: 'Prilled homogeneous compound. Apply 150 kg/acre alongside rows.',
    }),
  },
  {
    label: 'Granular Urea (46-0-0) 50kg Nitrogen Bag',
    payload: JSON.stringify({
      type: 'fertilizer',
      fertilizerName: 'Granular Urea (46-0-0) Pure Nitrogen',
      formulation: '46% Nitrogen',
      bagWeight: 50,
      unit: 'kg',
      applicationMethod: 'Broadcasting',
      cost: 54,
      vendor: 'National Fertilizer Supply Co',
      safetyNotes: 'Top dressing fertilizer. Apply immediately before light rain or irrigation.',
    }),
  },
  {
    label: 'NeemPro Botanical Bio-Pesticide (1 Liter)',
    payload: JSON.stringify({
      type: 'expense',
      category: 'Pesticides/Chemicals',
      description: 'NeemPro Cold-Pressed Organic Neem Oil (1 Liter)',
      amount: 28.5,
      vendor: 'BioAgri Crop Solutions',
      notes: 'Active azadirachtin 10,000 ppm. Dilute 5ml per liter for aphid and borer control.',
    }),
  },
];
