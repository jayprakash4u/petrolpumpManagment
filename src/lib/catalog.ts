export interface CatalogProduct {
  id: string;
  code: string;
  name: string;
  category: "Fuel" | "Lubricant" | "Spares & Equipment" | "Consumable" | "Services";
  unit: "Litre" | "Can" | "Piece" | "Bottle" | "Kg" | "Box";
  hsnCode: string;
  costPriceNpr: number;
  sellingPriceNpr: number;
  stockInHand: number;
  reorderLevel: number;
  vatRate: number; // 0 or 0.13
  vatable: boolean;
  active: boolean;
  assignedPumps?: string[];
  description?: string;
  lastRestockedDateBS?: string;
}

export interface StockAdjustmentRecord {
  id: string;
  dateBS: string;
  productCode: string;
  productName: string;
  type: "Evaporation Loss" | "Thermal Contraction" | "Dip Variance" | "Spillage" | "Calibration Test Return" | "Physical Count Audit";
  quantityChange: number; // negative for loss, positive for gain
  unit: string;
  tankOrLocation: string;
  reason: string;
  recordedBy: string;
  approvedBy: string;
  createdAt: string;
}

export const MOCK_CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    id: "prod-petrol",
    code: "FUEL-MS",
    name: "Motor Spirit (MS Petrol)",
    category: "Fuel",
    unit: "Litre",
    hsnCode: "27101211",
    costPriceNpr: 162.5,
    sellingPriceNpr: 175.0,
    stockInHand: 14250,
    reorderLevel: 5000,
    vatRate: 0,
    vatable: false,
    active: true,
    assignedPumps: ["Dispenser 1 - Nozzle 1", "Dispenser 2 - Nozzle 3", "Dispenser 3 - Nozzle 5"],
    description: "Standard Unleaded Petrol 91 Octane (NOC Depot)",
    lastRestockedDateBS: "2083-05-18",
  },
  {
    id: "prod-diesel",
    code: "FUEL-HSD",
    name: "High Speed Diesel (HSD)",
    category: "Fuel",
    unit: "Litre",
    hsnCode: "27101930",
    costPriceNpr: 148.0,
    sellingPriceNpr: 160.0,
    stockInHand: 28400,
    reorderLevel: 8000,
    vatRate: 0,
    vatable: false,
    active: true,
    assignedPumps: ["Dispenser 1 - Nozzle 2", "Dispenser 2 - Nozzle 4", "Dispenser 4 - Nozzle 7"],
    description: "Low Sulphur BS-VI Automotive Diesel Fuel",
    lastRestockedDateBS: "2083-05-19",
  },
  {
    id: "prod-gulf-4t",
    code: "LUB-GP-4T",
    name: "Gulf Pride 4T Plus 20W-40 (1L)",
    category: "Lubricant",
    unit: "Bottle",
    hsnCode: "27101980",
    costPriceNpr: 520,
    sellingPriceNpr: 650,
    stockInHand: 48,
    reorderLevel: 15,
    vatRate: 0.13,
    vatable: true,
    active: true,
    description: "Premium 4-Stroke Motorcycle Engine Oil with Oxy-Biting additive",
    lastRestockedDateBS: "2083-05-12",
  },
  {
    id: "prod-gulf-syntrac",
    code: "LUB-GS-10W30",
    name: "Gulf Syntrac 4T 10W-30 (1L)",
    category: "Lubricant",
    unit: "Bottle",
    hsnCode: "27101980",
    costPriceNpr: 680,
    sellingPriceNpr: 850,
    stockInHand: 32,
    reorderLevel: 10,
    vatRate: 0.13,
    vatable: true,
    active: true,
    description: "Fully Synthetic Engine Oil for modern BS-VI motorcycles & scooters",
    lastRestockedDateBS: "2083-05-12",
  },
  {
    id: "prod-castrol-gtx",
    code: "LUB-CAS-GTX",
    name: "Castrol GTX Diesel 15W-40 (5L Can)",
    category: "Lubricant",
    unit: "Can",
    hsnCode: "27101980",
    costPriceNpr: 2450,
    sellingPriceNpr: 2950,
    stockInHand: 18,
    reorderLevel: 5,
    vatRate: 0.13,
    vatable: true,
    active: true,
    description: "Heavy Duty Diesel Engine Oil for trucks, pickups and SUVs",
    lastRestockedDateBS: "2083-05-08",
  },
  {
    id: "prod-coolant",
    code: "CON-COOL-1L",
    name: "Radiator Coolant Concentrate (1L)",
    category: "Consumable",
    unit: "Bottle",
    hsnCode: "38200000",
    costPriceNpr: 280,
    sellingPriceNpr: 380,
    stockInHand: 25,
    reorderLevel: 8,
    vatRate: 0.13,
    vatable: true,
    active: true,
    description: "Ethylene glycol anti-freeze & anti-boil corrosion inhibitor",
    lastRestockedDateBS: "2083-05-05",
  },
  {
    id: "prod-zva-nozzle",
    code: "SPR-ZVA-SLIM",
    name: "ZVA Slimline Automatic Fuel Nozzle (Petrol)",
    category: "Spares & Equipment",
    unit: "Piece",
    hsnCode: "84139190",
    costPriceNpr: 12500,
    sellingPriceNpr: 15500,
    stockInHand: 4,
    reorderLevel: 2,
    vatRate: 0.13,
    vatable: true,
    active: true,
    description: "Elaflex automatic shut-off dispensing nozzle with splash guard",
    lastRestockedDateBS: "2083-04-25",
  },
  {
    id: "prod-filter-cartridge",
    code: "SPR-FLT-CART",
    name: "Fuel Dispenser 10-Micron Filter Cartridge",
    category: "Spares & Equipment",
    unit: "Piece",
    hsnCode: "84212900",
    costPriceNpr: 1850,
    sellingPriceNpr: 2400,
    stockInHand: 12,
    reorderLevel: 4,
    vatRate: 0.13,
    vatable: true,
    active: true,
    description: "High flow particulate and water sensing filter for Tokheim/Gilbarco",
    lastRestockedDateBS: "2083-05-01",
  },
];

export const MOCK_STOCK_ADJUSTMENTS: StockAdjustmentRecord[] = [
  {
    id: "adj-101",
    dateBS: "2083-05-18",
    productCode: "FUEL-MS",
    productName: "Motor Spirit (MS Petrol)",
    type: "Evaporation Loss",
    quantityChange: -35.5,
    unit: "Litres",
    tankOrLocation: "Underground Tank 1 (MS Petrol)",
    reason: "Daily atmospheric evaporation & temperature coefficient delta in ambient 32°C",
    recordedBy: "Bikash Thapa (Senior Operator)",
    approvedBy: "Anita Shrestha (Station Manager)",
    createdAt: "2026-09-02T16:45:00Z",
  },
  {
    id: "adj-102",
    dateBS: "2083-05-15",
    productCode: "FUEL-HSD",
    productName: "High Speed Diesel (HSD)",
    type: "Calibration Test Return",
    quantityChange: 20.0,
    unit: "Litres",
    tankOrLocation: "Underground Tank 2 (HSD Diesel)",
    reason: "5-Litre Weights & Measures brass check pour-back into storage tank after inspection",
    recordedBy: "Sunil Shrestha (Technician)",
    approvedBy: "Anita Shrestha (Station Manager)",
    createdAt: "2026-08-30T11:20:00Z",
  },
  {
    id: "adj-103",
    dateBS: "2083-05-10",
    productCode: "LUB-GP-4T",
    productName: "Gulf Pride 4T Plus 20W-40 (1L)",
    type: "Physical Count Audit",
    quantityChange: -1.0,
    unit: "Bottles",
    tankOrLocation: "Forecourt Display Shelf A",
    reason: "Damaged plastic seal during shelf restock, transferred to station service bay",
    recordedBy: "Ramesh Sharma (Storekeeper)",
    approvedBy: "Anita Shrestha (Station Manager)",
    createdAt: "2026-08-25T14:10:00Z",
  },
];
