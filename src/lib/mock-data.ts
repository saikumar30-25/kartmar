import tomatoes from "@/assets/tomatoes.jpg";
import onions from "@/assets/onions.jpg";
import mangoes from "@/assets/mangoes.jpg";
import rice from "@/assets/rice.jpg";
import chillies from "@/assets/chillies.jpg";

export type QualityGrade = "A" | "B" | "C";

export type Listing = {
  id: string;
  productName: string;
  telugu?: string;
  hindi?: string;
  category: "vegetables" | "fruits" | "grains" | "spices" | "dairy";
  photo: string;
  farmer: { id: string; name: string; village: string; rating: number };
  quantity: number;
  unit: "kg" | "quintal" | "ton";
  displayPrice: number; // paise per unit
  acceptPrice: number;
  floorPrice: number;
  qualityGrade: QualityGrade;
  freshnessScore: number;
  harvestedAt: Date;
  availableUntil: Date;
  distanceKm: number;
  description: string;
};

export type Requirement = {
  id: string;
  productName: string;
  category: Listing["category"];
  buyer: { id: string; name: string; business: string; rating: number };
  quantity: number;
  unit: Listing["unit"];
  offerPrice: number;
  willingPrice: number;
  ceilingPrice: number;
  requiredBy: Date;
  distanceKm: number;
  description: string;
};

export type Deal = {
  id: string;
  listingId: string;
  productName: string;
  photo: string;
  farmerName: string;
  buyerName: string;
  quantity: number;
  unit: Listing["unit"];
  agreedPrice: number;
  totalPaise: number;
  status: "confirmed" | "paid" | "in_transit" | "delivered" | "completed" | "disputed";
  createdAt: Date;
};

export type Trip = {
  id: string;
  dealId: string;
  pickup: string;
  delivery: string;
  distanceKm: number;
  weightKg: number;
  farePaise: number;
  status: "pending" | "accepted" | "picked_up" | "in_transit" | "delivered";
  scheduledFor: Date;
};

export type AppNotification = {
  id: string;
  type: "deal" | "bargain" | "payment" | "transport" | "system";
  message: string;
  at: Date;
  read: boolean;
};

const days = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

export const listings: Listing[] = [
  {
    id: "L1",
    productName: "Hybrid Tomatoes",
    telugu: "టమాటా",
    hindi: "टमाटर",
    category: "vegetables",
    photo: tomatoes,
    farmer: { id: "F1", name: "Venkata Reddy", village: "Guntur, AP", rating: 4.8 },
    quantity: 200,
    unit: "kg",
    displayPrice: 13000,
    acceptPrice: 11000,
    floorPrice: 10000,
    qualityGrade: "A",
    freshnessScore: 9,
    harvestedAt: days(-2),
    availableUntil: days(6),
    distanceKm: 12,
    description: "Fresh-picked hybrid tomatoes, firm and ripe. Suitable for hotels and bulk buyers.",
  },
  {
    id: "L2",
    productName: "Nasik Red Onions",
    telugu: "ఉల్లిపాయ",
    hindi: "प्याज़",
    category: "vegetables",
    photo: onions,
    farmer: { id: "F2", name: "Mandi Global", village: "Nasik, MH", rating: 4.4 },
    quantity: 1500,
    unit: "kg",
    displayPrice: 2400,
    acceptPrice: 2000,
    floorPrice: 1800,
    qualityGrade: "B",
    freshnessScore: 7,
    harvestedAt: days(-5),
    availableUntil: days(3),
    distanceKm: 45,
    description: "Standard grade red onions, well-cured for longer storage life.",
  },
  {
    id: "L3",
    productName: "Banganapalle Mangoes",
    telugu: "మామిడిపండు",
    hindi: "आम",
    category: "fruits",
    photo: mangoes,
    farmer: { id: "F3", name: "Lakshmi K.", village: "Kurnool, AP", rating: 4.9 },
    quantity: 80,
    unit: "kg",
    displayPrice: 18000,
    acceptPrice: 16000,
    floorPrice: 14000,
    qualityGrade: "A",
    freshnessScore: 9,
    harvestedAt: days(-1),
    availableUntil: days(1),
    distanceKm: 28,
    description: "Premium Banganapalle mangoes, hand-picked at peak ripeness.",
  },
  {
    id: "L4",
    productName: "Sona Masuri Rice",
    telugu: "బియ్యం",
    hindi: "चावल",
    category: "grains",
    photo: rice,
    farmer: { id: "F4", name: "Srinivas Rao", village: "Karimnagar, TS", rating: 4.6 },
    quantity: 3000,
    unit: "kg",
    displayPrice: 5200,
    acceptPrice: 4800,
    floorPrice: 4500,
    qualityGrade: "A",
    freshnessScore: 8,
    harvestedAt: days(-15),
    availableUntil: days(30),
    distanceKm: 64,
    description: "Aged Sona Masuri raw rice, single-source from our family farm.",
  },
  {
    id: "L5",
    productName: "Green Chillies",
    telugu: "పచ్చి మిర్చి",
    hindi: "हरी मिर्च",
    category: "spices",
    photo: chillies,
    farmer: { id: "F5", name: "Padma Devi", village: "Khammam, TS", rating: 4.7 },
    quantity: 120,
    unit: "kg",
    displayPrice: 8000,
    acceptPrice: 7000,
    floorPrice: 6200,
    qualityGrade: "A",
    freshnessScore: 8,
    harvestedAt: days(0),
    availableUntil: days(4),
    distanceKm: 38,
    description: "Sharp, glossy green chillies. Pesticide-free.",
  },
];

export const requirements: Requirement[] = [
  {
    id: "R1",
    productName: "Sona Masuri Rice",
    category: "grains",
    buyer: { id: "B1", name: "Hotel Swagath", business: "Restaurant chain, Hyderabad", rating: 4.5 },
    quantity: 500,
    unit: "kg",
    offerPrice: 4200,
    willingPrice: 4600,
    ceilingPrice: 5000,
    requiredBy: days(2),
    distanceKm: 8,
    description: "Need consistent quality rice for weekly supply. Grade A only.",
  },
  {
    id: "R2",
    productName: "Red Onions",
    category: "vegetables",
    buyer: { id: "B2", name: "Organic Mandi Corp", business: "Wholesale market", rating: 4.7 },
    quantity: 2000,
    unit: "kg",
    offerPrice: 2200,
    willingPrice: 2500,
    ceilingPrice: 2800,
    requiredBy: days(5),
    distanceKm: 22,
    description: "Recurring weekly order. Looking for reliable supplier.",
  },
  {
    id: "R3",
    productName: "Tomatoes",
    category: "vegetables",
    buyer: { id: "B3", name: "FreshKart Retail", business: "Retail chain", rating: 4.3 },
    quantity: 300,
    unit: "kg",
    offerPrice: 11000,
    willingPrice: 12500,
    ceilingPrice: 14000,
    requiredBy: days(1),
    distanceKm: 15,
    description: "Urgent — Grade A only. Daily restocking.",
  },
];

export const deals: Deal[] = [
  {
    id: "D1",
    listingId: "L1",
    productName: "Hybrid Tomatoes",
    photo: tomatoes,
    farmerName: "Venkata Reddy",
    buyerName: "FreshKart Retail",
    quantity: 200,
    unit: "kg",
    agreedPrice: 11200,
    totalPaise: 200 * 11200,
    status: "in_transit",
    createdAt: days(-1),
  },
  {
    id: "D2",
    listingId: "L4",
    productName: "Sona Masuri Rice",
    photo: rice,
    farmerName: "Srinivas Rao",
    buyerName: "Hotel Swagath",
    quantity: 500,
    unit: "kg",
    agreedPrice: 4800,
    totalPaise: 500 * 4800,
    status: "delivered",
    createdAt: days(-3),
  },
  {
    id: "D3",
    listingId: "L5",
    productName: "Green Chillies",
    photo: chillies,
    farmerName: "Padma Devi",
    buyerName: "Organic Mandi Corp",
    quantity: 120,
    unit: "kg",
    agreedPrice: 7400,
    totalPaise: 120 * 7400,
    status: "paid",
    createdAt: days(-1),
  },
];

export const trips: Trip[] = [
  {
    id: "T1",
    dealId: "D1",
    pickup: "Guntur, AP",
    delivery: "Hyderabad, TS",
    distanceKm: 270,
    weightKg: 200,
    farePaise: 480000,
    status: "in_transit",
    scheduledFor: days(0),
  },
  {
    id: "T2",
    dealId: "D2",
    pickup: "Karimnagar, TS",
    delivery: "Hyderabad, TS",
    distanceKm: 160,
    weightKg: 500,
    farePaise: 320000,
    status: "delivered",
    scheduledFor: days(-2),
  },
];

export const notifications: AppNotification[] = [
  { id: "N1", type: "bargain", message: "FreshKart Retail offered ₹110/kg for your tomatoes.", at: days(0), read: false },
  { id: "N2", type: "deal", message: "Deal confirmed: 500kg Sona Masuri with Hotel Swagath.", at: days(0), read: false },
  { id: "N3", type: "transport", message: "Driver Suresh assigned to your tomato delivery.", at: days(-1), read: true },
  { id: "N4", type: "payment", message: "₹24,000 released to your UPI for chillies deal.", at: days(-2), read: true },
];

export const partnerStats = {
  tripsThisMonth: 28,
  earningsPaise: 4280000,
  rating: 4.85,
  online: true,
};

export const advisorSeed = [
  {
    q: "When is the best time to harvest tomatoes in Telangana?",
    a: "Pluck when fruits are firm and 80% red. In Telangana's October–February cycle, early-morning harvesting (before 8am) maintains shelf life. Avoid harvesting after rain to prevent rot.",
  },
  {
    q: "What is the going rate for onions this month?",
    a: "Current Nasik wholesale: ₹22–28/kg. Telangana mandis are running ₹26–32/kg due to lower arrivals. Prices may firm up further next 7–10 days. Consider holding small-grade stock.",
  },
];

export const demandForecast = [
  { product: "Tomatoes", trend: "up", reason: "Festival demand + supply dip from Maharashtra rain." },
  { product: "Green chillies", trend: "up", reason: "Restaurant procurement is unusually high this week." },
  { product: "Onions", trend: "stable", reason: "Nasik arrivals back to normal volumes." },
];
