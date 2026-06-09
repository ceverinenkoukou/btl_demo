import type { Profile, Company, Product, Zone, Campaign, CampaignSite, CampaignTeamMember, Tasting, Sale, CampaignStats, HostessStats, Gender, AgeRange, TasteRating, PurchaseIntent } from "./types";

// Mock user data
export const mockUsers: Profile[] = [
  {
    id: "1",
    email: "admin@example.com",
    full_name: "Admin User",
    phone: "+33612345678",
    role: "admin",
    avatar_url: undefined,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    email: "supervisor@example.com",
    full_name: "Marie Dupont",
    phone: "+33687654321",
    role: "supervisor",
    avatar_url: undefined,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    email: "hostess@example.com",
    full_name: "Sophie Martin",
    phone: "+33611223344",
    role: "hostess",
    avatar_url: undefined,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock company data
export const mockCompanies: Company[] = [
  // {
  //   id: "1",
  //   name: "FreshUp Beverages",
  //   logo_url: undefined,
  //   address: "123 Rue du Commerce, Paris",
  //   contact_email: "contact@freshup.com",
  //   contact_phone: "+33123456789",
  //   created_by: "1",
  //   created_at: new Date().toISOString(),
  //   updated_at: new Date().toISOString(),
  // },
];

// Mock product data
export const mockProducts: Product[] = [
  // {
  //   id: "1",
  //   company_id: "1",
  //   name: "FreshUp Orange",
  //   description: "Jus d'orange naturel",
  //   sku: "FU-001",
  //   unit_price: 2.50,
  //   image_url: undefined,
  //   is_active: true,
  //   created_at: new Date().toISOString(),
  //   updated_at: new Date().toISOString(),
  //   company: mockCompanies[0],
  // },
  // {
  //   id: "2",
  //   company_id: "1",
  //   name: "FreshUp Apple",
  //   description: "Jus de pomme bio",
  //   sku: "FU-002",
  //   unit_price: 3.00,
  //   image_url: undefined,
  //   is_active: true,
  //   created_at: new Date().toISOString(),
  //   updated_at: new Date().toISOString(),
  //   company: mockCompanies[0],
  // },
];

// Mock zone data
export const mockZones: Zone[] = [
  {
    id: "1",
    name: "Zone Paris Centre",
    city: "Paris",
    region: "Île-de-France",
    country: "France",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Zone Lyon",
    city: "Lyon",
    region: "Auvergne-Rhône-Alpes",
    country: "France",
    created_at: new Date().toISOString(),
  },
];

// Mock campaign data
export const mockCampaigns: Campaign[] = [
  // {
  //   id: "1",
  //   company_id: "1",
  //   name: "Campagne Été 2024",
  //   description: "Dégustation estivale dans les centres commerciaux",
  //   zone_id: "1",
  //   location_details: "Centre Commercial Les Halles",
  //   sales_objective: 500,
  //   tasting_objective: 1000,
  //   start_date: "2024-06-01",
  //   end_date: "2024-08-31",
  //   status: "active",
  //   created_by: "1",
  //   created_at: new Date().toISOString(),
  //   updated_at: new Date().toISOString(),
  //   company: mockCompanies[0],
  //   zone: mockZones[0],
  //   products: mockProducts,
  // },
  // {
  //   id: "2",
  //   company_id: "1",
  //   name: "Campagne Rentrée 2024",
  //   description: "Lancement nouveau produit",
  //   zone_id: "2",
  //   location_details: "Centre Commercial Part-Dieu",
  //   sales_objective: 300,
  //   tasting_objective: 600,
  //   start_date: "2024-09-01",
  //   end_date: "2024-11-30",
  //   status: "planned",
  //   created_by: "1",
  //   created_at: new Date().toISOString(),
  //   updated_at: new Date().toISOString(),
  //   company: mockCompanies[0],
  //   zone: mockZones[1],
  //   products: mockProducts,
  // },
];

// Mock campaign team assignments
export const mockCampaignTeam: CampaignTeamMember[] = [
  {
    id: "1",
    campaign_id: "1",
    user_id: "3",
    role: "hostess",
    assigned_at: new Date().toISOString(),
    user: mockUsers[2],
  },
];

// // Mock tasting data
export const mockTastings: Tasting[] = [
  {
    id: "1",
    campaign_id: "1",
    hostess_id: "3",
    product_id: "1",
    gender: "female",
    age_range: "26-35",
    taste_rating: "4",
    purchase_intent: "high",
    has_purchased: true,
    notes: "Très satisfait",
    created_at: new Date().toISOString(),
    campaign: mockCampaigns[0],
    hostess: mockUsers[2],
    product: mockProducts[0],
  },
//   {
//     id: "2",
//     campaign_id: "1",
//     hostess_id: "3",
//     product_id: "2",
//     gender: "male",
//     age_range: "36-45",
//     taste_rating: "5",
//     purchase_intent: "high",
//     has_purchased: true,
//     notes: "Excellent goût",
//     created_at: new Date().toISOString(),
//     campaign: mockCampaigns[0],
//     hostess: mockUsers[2],
//     product: mockProducts[1],
//   },
];

//  Mock sales data
export const mockSales: Sale[] = [
  {
    id: "1",
    campaign_id: "1",
    tasting_id: "1",
    hostess_id: "3",
    product_id: "1",
    quantity: 2,
    unit_price: 2.50,
    total_amount: 5.00,
    validated: true,
    validated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    campaign: mockCampaigns[0],
    tasting: mockTastings[0],
    hostess: mockUsers[2],
    product: mockProducts[0],
  },
  {
    id: "2",
    campaign_id: "1",
    tasting_id: "2",
    hostess_id: "3",
    product_id: "2",
    quantity: 1,
    unit_price: 3.00,
    total_amount: 3.00,
    validated: true,
    validated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    campaign: mockCampaigns[0],
    tasting: mockTastings[1],
    hostess: mockUsers[2],
    product: mockProducts[1],
  },
];

// // Mock campaign stats
// export const mockCampaignStats: CampaignStats = {
//   total_tastings: 150,
//   total_sales: 75,
//   total_revenue: 187.50,
//   conversion_rate: 50,
//   tastings_by_gender: [
//     { gender: "female", count: 85 },
//     { gender: "male", count: 60 },
//     { gender: "other", count: 5 },
//   ],
//   tastings_by_age: [
//     { age_range: "18-25", count: 30 },
//     { age_range: "26-35", count: 50 },
//     { age_range: "36-45", count: 40 },
//     { age_range: "46-55", count: 20 },
//     { age_range: "55+", count: 10 },
//   ],
//   tastings_by_rating: [
//     { rating: "1", count: 5 },
//     { rating: "2", count: 10 },
//     { rating: "3", count: 25 },
//     { rating: "4", count: 60 },
//     { rating: "5", count: 50 },
//   ],
//   sales_by_product: [
//     { product_name: "FreshUp Orange", quantity: 45, revenue: 112.50 },
//     { product_name: "FreshUp Apple", quantity: 30, revenue: 75.00 },
//   ],
// };

// // Mock hostess stats
// export const mockHostessStats: HostessStats = {
//   total_tastings: 150,
//   total_sales: 75,
//   total_revenue: 187.50,
//   conversion_rate: 50,
//   average_rating: 4.2,
//   campaigns_count: 1,
// };

// ─── 33 Export / Sobraga data ──────────────────────────────────────────────

export const sobragoCompany: Company = {
  id: "2",
  name: "Sobraga - 33 Export",
  logo_url: undefined,
  address: "Zone Industrielle d'Oloumi, Libreville, Gabon",
  contact_email: "sobraga@33export.ga",
  contact_phone: "+24177000000",
  created_by: "1",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const export33Products: Product[] = [
  {
    id: "3",
    company_id: "2",
    name: "33 Export 33cl (Canette)",
    description: "Bière blonde premium en canette 33cl",
    sku: "33EX-033",
    unit_price: 700,
    image_url: undefined,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    company: sobragoCompany,
  },
  {
    id: "4",
    company_id: "2",
    name: "33 Export 65cl (Bouteille)",
    description: "Bière blonde premium en bouteille 65cl",
    sku: "33EX-065",
    unit_price: 1200,
    image_url: undefined,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    company: sobragoCompany,
  },
];

export const gabonZones: Zone[] = [
  { id: "3", name: "Libreville - Mont-Bouët",    city: "Libreville",  region: "Estuaire",         country: "Gabon", created_at: new Date().toISOString() },
  { id: "4", name: "Libreville - Charbonnages",  city: "Libreville",  region: "Estuaire",         country: "Gabon", created_at: new Date().toISOString() },
  { id: "5", name: "Port-Gentil - Centre",       city: "Port-Gentil", region: "Ogooué-Maritime",   country: "Gabon", created_at: new Date().toISOString() },
  { id: "6", name: "Franceville",                city: "Franceville", region: "Haut-Ogooué",       country: "Gabon", created_at: new Date().toISOString() },
  { id: "7", name: "Oyem - Marché central",      city: "Oyem",        region: "Woleu-Ntem",        country: "Gabon", created_at: new Date().toISOString() },
  // CHR LBV – Fans Zones Coupe du Monde
  { id: "8", name: "LBV - Fans Zone Angondjé",   city: "Libreville",  region: "Estuaire",         country: "Gabon", created_at: new Date().toISOString() },
  { id: "9", name: "LBV - Fans Zone Bambouchine",city: "Libreville",  region: "Estuaire",         country: "Gabon", created_at: new Date().toISOString() },
];

export const export33Users: Profile[] = [
  // Compte entreprise
  { id: "4",  email: "sobraga@33export.ga",          full_name: "Sobraga SA",           phone: "+24177000000", role: "company",    company_id: "2", avatar_url: undefined, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // Superviseurs GMS
  { id: "5",  email: "superviseur1.gms@sobraga.ga",  full_name: "Jean-Marc Obiang",     phone: "+24166001122", role: "supervisor", avatar_url: undefined, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "6",  email: "superviseur2.gms@sobraga.ga",  full_name: "Hervé Mounguengui",    phone: "+24166003344", role: "supervisor", avatar_url: undefined, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // Hôtesses GMS (10 VAC)
  { id: "7",  email: "hotesse1.gms@sobraga.ga",      full_name: "Flore Mba",            phone: "+24177110011", role: "hostess",   avatar_url: undefined, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "8",  email: "hotesse2.gms@sobraga.ga",      full_name: "Patricia Nguema",      phone: "+24177220022", role: "hostess",   avatar_url: undefined, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "9",  email: "hotesse3.gms@sobraga.ga",      full_name: "Christelle Ondo",      phone: "+24177330033", role: "hostess",   avatar_url: undefined, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "10", email: "hotesse4.gms@sobraga.ga",      full_name: "Marlène Nzé",          phone: "+24177440044", role: "hostess",   avatar_url: undefined, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "11", email: "hotesse5.gms@sobraga.ga",      full_name: "Ange Mouloungou",      phone: "+24177550055", role: "hostess",   avatar_url: undefined, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "12", email: "hotesse6.gms@sobraga.ga",      full_name: "Brenda Nzamba",        phone: "+24177660066", role: "hostess",   avatar_url: undefined, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "13", email: "hotesse7.gms@sobraga.ga",      full_name: "Carine Mfoula",        phone: "+24177770077", role: "hostess",   avatar_url: undefined, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "14", email: "hotesse8.gms@sobraga.ga",      full_name: "Délice Koumba",        phone: "+24177880088", role: "hostess",   avatar_url: undefined, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "15", email: "hotesse9.gms@sobraga.ga",      full_name: "Emeline Bouanga",      phone: "+24177990099", role: "hostess",   avatar_url: undefined, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "16", email: "hotesse10.gms@sobraga.ga",     full_name: "Fatou Massala",        phone: "+24177001100", role: "hostess",   avatar_url: undefined, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // Superviseur CHR
  { id: "17", email: "superviseur.chr@sobraga.ga",   full_name: "Aurélien Ndong",       phone: "+24166005566", role: "supervisor", avatar_url: undefined, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // Hôtesses CHR (8)
  { id: "18", email: "hotesse1.chr@sobraga.ga",      full_name: "Rachelle Bouanga",     phone: "+24177112233", role: "hostess",   avatar_url: undefined, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "19", email: "hotesse2.chr@sobraga.ga",      full_name: "Inès Mba Nkoghe",     phone: "+24177223344", role: "hostess",   avatar_url: undefined, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "20", email: "hotesse3.chr@sobraga.ga",      full_name: "Vanessa Ondo Ella",   phone: "+24177334455", role: "hostess",   avatar_url: undefined, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "21", email: "hotesse4.chr@sobraga.ga",      full_name: "Carole Nguema",        phone: "+24177445566", role: "hostess",   avatar_url: undefined, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "22", email: "hotesse5.chr@sobraga.ga",      full_name: "Sandrine Moubamba",   phone: "+24177556677", role: "hostess",   avatar_url: undefined, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "23", email: "hotesse6.chr@sobraga.ga",      full_name: "Évelyne Nze",          phone: "+24177667788", role: "hostess",   avatar_url: undefined, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "24", email: "hotesse7.chr@sobraga.ga",      full_name: "Bijou Ella Mengue",    phone: "+24177778899", role: "hostess",   avatar_url: undefined, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "25", email: "hotesse8.chr@sobraga.ga",      full_name: "Ornella Ayo",          phone: "+24177889900", role: "hostess",   avatar_url: undefined, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const export33Campaign: Campaign = {
  id: "3",
  company_id: "2",
  name: "Animation 33 Export GMS",
  description: "Animation GMS – Achat avec gain sur la 33 Export CAN 33cl. 4 CAN achetées = 1 CAN offerte / 6 CAN achetées = 1 tirage. Du mercredi au samedi, 24 Juin au 11 Juillet (12 jours animés). 10 Hôtesses VAC sur 5 PDV.",
  location_details: "5 PDV : Libreville Mont-Bouët, Libreville Charbonnages, Port-Gentil, Franceville, Oyem",
  sales_objective: 1140,
  tasting_objective: 0,
  start_date: "2025-06-24",
  end_date: "2025-07-11",
  status: "active",
  created_by: "1",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  company: sobragoCompany,
  products: export33Products,
  team: [],
  sites: [],
};

// Sites de la campagne 33 Export (un par zone)
export const export33CampaignSites: CampaignSite[] = [
  { id: "s1", campaign_id: "3", zone_id: "3", name: "Libreville - Mont-Bouët",     zone: gabonZones[0] },
  { id: "s2", campaign_id: "3", zone_id: "4", name: "Libreville - Charbonnages",  zone: gabonZones[1] },
  { id: "s3", campaign_id: "3", zone_id: "5", name: "Port-Gentil - Centre",       zone: gabonZones[2] },
  { id: "s4", campaign_id: "3", zone_id: "6", name: "Franceville",                zone: gabonZones[3] },
  { id: "s5", campaign_id: "3", zone_id: "7", name: "Oyem - Marché central",      zone: gabonZones[4] },
];

// GMS équipe : Jean-Marc (5) couvre s1+s2+s5, Hervé (6) couvre s3+s4. 2 hôtesses par PDV.
export const export33CampaignTeam: CampaignTeamMember[] = [
  // Superviseurs GMS
  { id: "g01", campaign_id: "3", site_id: "s1", user_id: "5",  role: "supervisor", assigned_at: new Date().toISOString(), user: export33Users[1] },
  { id: "g02", campaign_id: "3", site_id: "s2", user_id: "5",  role: "supervisor", assigned_at: new Date().toISOString(), user: export33Users[1] },
  { id: "g03", campaign_id: "3", site_id: "s5", user_id: "5",  role: "supervisor", assigned_at: new Date().toISOString(), user: export33Users[1] },
  { id: "g04", campaign_id: "3", site_id: "s3", user_id: "6",  role: "supervisor", assigned_at: new Date().toISOString(), user: export33Users[2] },
  { id: "g05", campaign_id: "3", site_id: "s4", user_id: "6",  role: "supervisor", assigned_at: new Date().toISOString(), user: export33Users[2] },
  // Hôtesses GMS (10 VAC — 2 par PDV)
  { id: "g06", campaign_id: "3", site_id: "s1", user_id: "7",  role: "hostess", assigned_at: new Date().toISOString(), user: export33Users[3]  },
  { id: "g07", campaign_id: "3", site_id: "s1", user_id: "8",  role: "hostess", assigned_at: new Date().toISOString(), user: export33Users[4]  },
  { id: "g08", campaign_id: "3", site_id: "s2", user_id: "9",  role: "hostess", assigned_at: new Date().toISOString(), user: export33Users[5]  },
  { id: "g09", campaign_id: "3", site_id: "s2", user_id: "10", role: "hostess", assigned_at: new Date().toISOString(), user: export33Users[6]  },
  { id: "g10", campaign_id: "3", site_id: "s3", user_id: "11", role: "hostess", assigned_at: new Date().toISOString(), user: export33Users[7]  },
  { id: "g11", campaign_id: "3", site_id: "s3", user_id: "12", role: "hostess", assigned_at: new Date().toISOString(), user: export33Users[8]  },
  { id: "g12", campaign_id: "3", site_id: "s4", user_id: "13", role: "hostess", assigned_at: new Date().toISOString(), user: export33Users[9]  },
  { id: "g13", campaign_id: "3", site_id: "s4", user_id: "14", role: "hostess", assigned_at: new Date().toISOString(), user: export33Users[10] },
  { id: "g14", campaign_id: "3", site_id: "s5", user_id: "15", role: "hostess", assigned_at: new Date().toISOString(), user: export33Users[11] },
  { id: "g15", campaign_id: "3", site_id: "s5", user_id: "16", role: "hostess", assigned_at: new Date().toISOString(), user: export33Users[12] },
  // Compte test — Sophie Martin
  { id: "g16", campaign_id: "3", site_id: "s1", user_id: "3",  role: "hostess", assigned_at: new Date().toISOString(), user: mockUsers[2] },
];

// ─── Campagne CHR LBV ──────────────────────────────────────────────────────

export const export33CampaignCHR: Campaign = {
  id: "4",
  company_id: "2",
  name: "Animation 33 Export Coupe du Monde CHR LBV",
  description: "Animation CHR LBV – Achat avec gain sur la 33 Export VC 33cl. 3 bouteilles achetées = 1 bouteille offerte / 9 bouteilles achetées = 1 tirage. 2 grandes Fans Zones à Libreville, 16 juin au 19 juillet (16 jours animés). 8 Hôtesses CHR.",
  location_details: "2 grandes Fans Zones à Libreville : Angondjé & Bambouchine",
  sales_objective: 320,
  tasting_objective: 0,
  start_date: "2025-06-16",
  end_date: "2025-07-19",
  status: "active",
  created_by: "1",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  company: sobragoCompany,
  products: [export33Products[1]],
  team: [],
  sites: [],
};

export const export33CampaignSitesCHR: CampaignSite[] = [
  { id: "s6", campaign_id: "4", zone_id: "8", name: "LBV - Fans Zone Angondjé",    zone: gabonZones[5] },
  { id: "s7", campaign_id: "4", zone_id: "9", name: "LBV - Fans Zone Bambouchine", zone: gabonZones[6] },
];

// CHR équipe : Aurélien (17) supervise les 2 fans zones. 4 hôtesses par zone.
export const export33CampaignTeamCHR: CampaignTeamMember[] = [
  // Superviseur CHR
  { id: "c01", campaign_id: "4", site_id: "s6", user_id: "17", role: "supervisor", assigned_at: new Date().toISOString(), user: export33Users[13] },
  { id: "c02", campaign_id: "4", site_id: "s7", user_id: "17", role: "supervisor", assigned_at: new Date().toISOString(), user: export33Users[13] },
  // Hôtesses CHR (8 — 4 par Fans Zone)
  { id: "c03", campaign_id: "4", site_id: "s6", user_id: "18", role: "hostess", assigned_at: new Date().toISOString(), user: export33Users[14] },
  { id: "c04", campaign_id: "4", site_id: "s6", user_id: "19", role: "hostess", assigned_at: new Date().toISOString(), user: export33Users[15] },
  { id: "c05", campaign_id: "4", site_id: "s6", user_id: "20", role: "hostess", assigned_at: new Date().toISOString(), user: export33Users[16] },
  { id: "c06", campaign_id: "4", site_id: "s6", user_id: "21", role: "hostess", assigned_at: new Date().toISOString(), user: export33Users[17] },
  { id: "c07", campaign_id: "4", site_id: "s7", user_id: "22", role: "hostess", assigned_at: new Date().toISOString(), user: export33Users[18] },
  { id: "c08", campaign_id: "4", site_id: "s7", user_id: "23", role: "hostess", assigned_at: new Date().toISOString(), user: export33Users[19] },
  { id: "c09", campaign_id: "4", site_id: "s7", user_id: "24", role: "hostess", assigned_at: new Date().toISOString(), user: export33Users[20] },
  { id: "c10", campaign_id: "4", site_id: "s7", user_id: "25", role: "hostess", assigned_at: new Date().toISOString(), user: export33Users[21] },
];

// hostess → site principal (pour les dégustations générées)
const hostessSiteMapGMS: Record<string, string> = {
  "7":  "s1", "8":  "s1",  // s1 Mont-Bouët
  "9":  "s2", "10": "s2",  // s2 Charbonnages
  "11": "s3", "12": "s3",  // s3 Port-Gentil
  "13": "s4", "14": "s4",  // s4 Franceville
  "15": "s5", "16": "s5",  // s5 Oyem
};
const hostessSiteMapCHR: Record<string, string> = {
  "18": "s6", "19": "s6", "20": "s6", "21": "s6",  // s6 Angondjé
  "22": "s7", "23": "s7", "24": "s7", "25": "s7",  // s7 Bambouchine
};

// Cycles déterministes
const genderCycle: Gender[]         = ["female", "male", "female", "male", "female", "other", "female", "male", "female", "male"];
const ageCycle: AgeRange[]          = ["18-25", "26-35", "36-45", "18-25", "26-35", "46-55", "18-25", "26-35", "36-45", "26-35"];
const ratingCycle: TasteRating[]    = ["4", "5", "3", "5", "4", "4", "5", "3", "4", "5"];
const intentCycle: PurchaseIntent[] = ["high", "high", "medium", "high", "high", "low", "high", "medium", "high", "high"];
const purchasedCycle                = [true, true, false, true, true, false, true, false, true, true];

function makeDateGMS(dayOffset: number): string {
  const d = new Date("2025-06-24T09:00:00Z");
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString();
}
function makeDateCHR(dayOffset: number): string {
  const d = new Date("2025-06-16T09:00:00Z");
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString();
}

// GMS – 12 jours animés (mer/jeu/ven/sam), 10 hôtesses, canette 33cl
export const export33Tastings: Tasting[] = (() => {
  const result: Tasting[] = [];
  const hostessIds = ["7","8","9","10","11","12","13","14","15","16"];
  // Jours GMS actifs dans le calendrier (mer=0, jeu=1, ven=2, sam=3 de chaque semaine)
  const activeDayOffsets = [0,1,2,3, 7,8,9,10, 14,15,16,17];
  let idx = 0;
  for (const day of activeDayOffsets) {
    for (let t = 0; t < 20; t++) {
      const i = idx++;
      const hostessId = hostessIds[i % hostessIds.length];
      const siteId = hostessSiteMapGMS[hostessId] ?? "s1";
      result.push({
        id: String(200 + i),
        campaign_id: "3",
        hostess_id: hostessId,
        product_id: "3",
        site_id: siteId,
        gender: genderCycle[i % genderCycle.length],
        age_range: ageCycle[i % ageCycle.length],
        taste_rating: ratingCycle[i % ratingCycle.length],
        purchase_intent: intentCycle[i % intentCycle.length],
        has_purchased: purchasedCycle[i % purchasedCycle.length],
        notes: "",
        created_at: makeDateGMS(day),
        campaign: export33Campaign,
        hostess: export33Users.find(u => u.id === hostessId)!,
        product: export33Products[0],
      });
    }
  }
  return result;
})();

export const export33Sales: Sale[] = (() => {
  const result: Sale[] = [];
  export33Tastings.forEach((tasting, i) => {
    if (tasting.has_purchased) {
      const qty = i % 4 === 0 ? 2 : 1;
      result.push({
        id: String(300 + result.length),
        campaign_id: "3",
        tasting_id: tasting.id,
        hostess_id: tasting.hostess_id,
        product_id: "3",
        site_id: tasting.site_id,
        quantity: qty,
        unit_price: 700,
        total_amount: 700 * qty,
        validated: true,
        validated_at: tasting.created_at,
        created_at: tasting.created_at,
        campaign: export33Campaign,
        tasting,
        hostess: tasting.hostess,
        product: export33Products[0],
      });
    }
  });
  return result;
})();

// CHR LBV – 16 jours animés, 8 hôtesses, bouteille 65cl
export const export33TastingsCHR: Tasting[] = (() => {
  const result: Tasting[] = [];
  const hostessIds = ["18","19","20","21","22","23","24","25"];
  let idx = 0;
  for (let day = 0; day < 16; day++) {
    for (let t = 0; t < 16; t++) {
      const i = idx++;
      const hostessId = hostessIds[i % hostessIds.length];
      const siteId = hostessSiteMapCHR[hostessId] ?? "s6";
      result.push({
        id: String(500 + i),
        campaign_id: "4",
        hostess_id: hostessId,
        product_id: "4",
        site_id: siteId,
        gender: genderCycle[i % genderCycle.length],
        age_range: ageCycle[i % ageCycle.length],
        taste_rating: ratingCycle[i % ratingCycle.length],
        purchase_intent: intentCycle[i % intentCycle.length],
        has_purchased: purchasedCycle[i % purchasedCycle.length],
        notes: "",
        created_at: makeDateCHR(day),
        campaign: export33CampaignCHR,
        hostess: export33Users.find(u => u.id === hostessId)!,
        product: export33Products[1],
      });
    }
  }
  return result;
})();

export const export33SalesCHR: Sale[] = (() => {
  const result: Sale[] = [];
  export33TastingsCHR.forEach((tasting, i) => {
    if (tasting.has_purchased) {
      const qty = i % 3 === 0 ? 2 : 1;
      result.push({
        id: String(700 + result.length),
        campaign_id: "4",
        tasting_id: tasting.id,
        hostess_id: tasting.hostess_id,
        product_id: "4",
        site_id: tasting.site_id,
        quantity: qty,
        unit_price: 1200,
        total_amount: 1200 * qty,
        validated: true,
        validated_at: tasting.created_at,
        created_at: tasting.created_at,
        campaign: export33CampaignCHR,
        tasting,
        hostess: tasting.hostess,
        product: export33Products[1],
      });
    }
  });
  return result;
})();

// Aggregate stats pour le tableau de bord — 2 campagnes combinées (GMS + CHR LBV)
export const mock33ExportStats = {
  // Objectifs : GMS=1140 + CHR=320 = 1460 total
  totalTastings: 2745,
  totalSales: 1342,
  conversionRate: 48.9,
  totalRevenue: 1_085_400,
  goodiesDistributed: 1680,   // GMS 720 + CHR 960
  objectiveSalesPct: Math.round((1342 / 1460) * 100),
  // Performance par site (GMS 5 PDV + CHR 2 Fans Zones)
  byZone: [
    { zone: "Libreville - Mont-Bouët",    tastings: 610, sales: 305 },
    { zone: "Libreville - Charbonnages",  tastings: 530, sales: 265 },
    { zone: "Port-Gentil - Centre",       tastings: 440, sales: 220 },
    { zone: "Franceville",                tastings: 310, sales: 155 },
    { zone: "Oyem - Marché central",      tastings: 210, sales: 105 },
    { zone: "Fans Zone Angondjé",         tastings: 360, sales: 180 },
    { zone: "Fans Zone Bambouchine",      tastings: 285, sales: 112 },
  ],
  byProduct: [
    { name: "33 Export 33cl (Canette)",    sales: 1050, revenue: 735_000 },
    { name: "33 Export 65cl (Bouteille)",  sales: 292,  revenue: 350_400 },
  ],
  // Données journalières 16 Juin – 19 Juillet
  // CHR actif tous les jours ; GMS actif mer/jeu/ven/sam du 24 juin au 11 juillet
  dailyData: [
    // CHR uniquement (Jun 16–23)
    { date: "16 juin",  tastings: 32,  sales: 16  },
    { date: "17 juin",  tastings: 35,  sales: 17  },
    { date: "18 juin",  tastings: 38,  sales: 19  },
    { date: "19 juin",  tastings: 36,  sales: 18  },
    { date: "20 juin",  tastings: 42,  sales: 21  },
    { date: "21 juin",  tastings: 48,  sales: 24  },
    { date: "22 juin",  tastings: 44,  sales: 22  },
    { date: "23 juin",  tastings: 38,  sales: 19  },
    // GMS semaine 1 (24–27 juin)
    { date: "24 juin",  tastings: 182, sales: 91  },
    { date: "25 juin",  tastings: 195, sales: 97  },
    { date: "26 juin",  tastings: 208, sales: 104 },
    { date: "27 juin",  tastings: 214, sales: 107 },
    // CHR uniquement (28–30 juin)
    { date: "28 juin",  tastings: 40,  sales: 20  },
    { date: "29 juin",  tastings: 36,  sales: 18  },
    { date: "30 juin",  tastings: 34,  sales: 17  },
    // GMS semaine 2 (1–4 juil.)
    { date: "1 juil.",  tastings: 188, sales: 94  },
    { date: "2 juil.",  tastings: 198, sales: 99  },
    { date: "3 juil.",  tastings: 205, sales: 102 },
    { date: "4 juil.",  tastings: 210, sales: 105 },
    // CHR uniquement (5–7 juil.)
    { date: "5 juil.",  tastings: 38,  sales: 19  },
    { date: "6 juil.",  tastings: 34,  sales: 17  },
    { date: "7 juil.",  tastings: 32,  sales: 16  },
    // GMS semaine 3 (8–11 juil.)
    { date: "8 juil.",  tastings: 185, sales: 92  },
    { date: "9 juil.",  tastings: 192, sales: 96  },
    { date: "10 juil.", tastings: 200, sales: 100 },
    { date: "11 juil.", tastings: 190, sales: 95  },
    // CHR uniquement (12–19 juil.)
    { date: "12 juil.", tastings: 42,  sales: 21  },
    { date: "13 juil.", tastings: 38,  sales: 19  },
    { date: "14 juil.", tastings: 40,  sales: 20  },
    { date: "15 juil.", tastings: 45,  sales: 22  },
    { date: "16 juil.", tastings: 43,  sales: 21  },
    { date: "17 juil.", tastings: 47,  sales: 23  },
    { date: "18 juil.", tastings: 50,  sales: 25  },
    { date: "19 juil.", tastings: 46,  sales: 23  },
  ],
  byGender: [
    { name: "Femme", value: 54 },
    { name: "Homme", value: 42 },
    { name: "Autre", value: 4  },
  ],
  byAge: [
    { name: "18-25", value: 30 },
    { name: "26-35", value: 37 },
    { name: "36-45", value: 21 },
    { name: "46-55", value: 8  },
    { name: "55+",   value: 4  },
  ],
};

// ─── GMS Promotion Mechanics ─────────────────────────────────────────────────
// Canettes vendues par site par jour GMS (12 jours : mer→sam × 3 semaines)
// Totaux : Mont-Bouët=305  Charbonnages=265  Port-Gentil=220  Franceville=155  Oyem=105
const _gmsDays = ["24 juin","25 juin","26 juin","27 juin","1 juil.","2 juil.","3 juil.","4 juil.","8 juil.","9 juil.","10 juil.","11 juil."];
const _gmsCanByDay: [string, number[]][] = [
  ["Mont-Bouët",   [22,24,26,28,23,25,26,27,22,24,26,32]],
  ["Charbonnages", [19,21,23,25,20,21,22,24,19,21,23,27]],
  ["Port-Gentil",  [15,17,19,21,16,17,19,21,15,17,20,23]],
  ["Franceville",  [11,12,14,15,11,12,13,14,11,12,14,16]],
  ["Oyem",         [ 7, 8, 9,10, 7, 8, 9,10, 7, 8, 9,13]],
];
// Packs vendus par site (4 packs = 1 pack offert + 1 ticket bonus + 1 lot)
const _gmsPacksBySite: { site: string; packs: number }[] = [
  { site: "Mont-Bouët",   packs: 124 },
  { site: "Charbonnages", packs: 108 },
  { site: "Port-Gentil",  packs: 88  },
  { site: "Franceville",  packs: 60  },
  { site: "Oyem",         packs: 40  },
];

export const gmsPromoData = {
  // Écoulement Packs : 1 pack acheté = 1 ticket  |  4 packs = 1 pack offert + ticket + lot
  packPromo: {
    packsSold:     420,
    ticketsOfferts: 525,  // packsSold + floor(packsSold/4) = 420 + 105
    packsOfferts:   105,  // floor(420/4)
    goodiesGagnés:  105,  // 1 lot par tranche de 4 packs
    bySite: _gmsPacksBySite.map(s => ({
      site:         s.site,
      packs:        s.packs,
      packsOfferts: Math.floor(s.packs / 4),
      goodies:      Math.floor(s.packs / 4),
      tickets:      s.packs + Math.floor(s.packs / 4),
    })),
  },
  // Écoulement Canettes : 4 canettes = 1 offerte  |  6 canettes = 1 ticket tombola
  canettePromo: {
    canettesVendues: 1050,
    canetteOffertes: 262,  // floor(1050/4)
    ticketsTombola:  175,  // floor(1050/6)
    bySite: _gmsCanByDay.map(([site, days]) => {
      const total = days.reduce((a, b) => a + b, 0);
      return { site, canettes: total, offertes: Math.floor(total / 4), tickets: Math.floor(total / 6) };
    }),
  },
  // Performance journalière par site (canettes vendues, offertes, tickets tombola)
  sitePerDay: _gmsDays.map((date, di) => ({
    date,
    sites: _gmsCanByDay.map(([site, days]) => ({
      site,
      canettes: days[di],
      offertes: Math.floor(days[di] / 4),
      tickets:  Math.floor(days[di] / 6),
    })),
  })),
};

// ─── CHR LBV Promotion Mechanics ─────────────────────────────────────────────
// 3 bouteilles achetées = 1 bouteille offerte  |  9 bouteilles = 1 tirage tombola
// 16 jours animés (matchs CdM) — Finale le 19 juillet = ticket tombola spécial
// Totaux : Angondjé=180  Bambouchine=112
const _chrDays = ["16 juin","17 juin","18 juin","19 juin","20 juin","21 juin","22 juin","23 juin","28 juin","29 juin","30 juin","5 juil.","6 juil.","7 juil.","12 juil.","19 juil.🏆"];
const _chrBottlesByDay: [string, number[]][] = [
  ["Fans Zone Angondjé",    [10,10,11,11,12,13,12,11,10,10, 9,10,11,12,13,15]],
  ["Fans Zone Bambouchine", [ 6, 7, 7, 7, 7, 7, 8, 7, 7, 6, 6, 6, 7, 8, 8, 8]],
];

export const chrPromoData = {
  // Mécanique : 3 bouteilles = 1 offerte  |  9 bouteilles = 1 tirage tombola
  bouteillePromo: {
    bouteillesVendues:  292,
    bouteillesOffertes:  97,  // floor(292/3)
    tiragesTombola:      32,  // floor(292/9)
    noteFinale: "19 juillet — Lors de la finale : 1 ticket tombola spécial",
    bySite: _chrBottlesByDay.map(([site, days]) => {
      const total = days.reduce((a, b) => a + b, 0);
      return {
        site,
        bouteilles: total,
        offertes:   Math.floor(total / 3),
        tirages:    Math.floor(total / 9),
      };
    }),
  },
  sitePerDay: _chrDays.map((date, di) => ({
    date,
    isFinale: di === _chrDays.length - 1,
    sites: _chrBottlesByDay.map(([site, days]) => ({
      site,
      bouteilles: days[di],
      offertes:   Math.floor(days[di] / 3),
      tirages:    Math.floor(days[di] / 9),
    })),
  })),
};

// Populate site teams
export33CampaignSites.forEach(site => {
  site.team = export33CampaignTeam.filter(m => m.site_id === site.id);
});
export33CampaignSitesCHR.forEach(site => {
  site.team = export33CampaignTeamCHR.filter(m => m.site_id === site.id);
});

// Attach sites + team to campaigns
export33Campaign.sites    = export33CampaignSites;
export33Campaign.team     = export33CampaignTeam;
export33CampaignCHR.sites = export33CampaignSitesCHR;
export33CampaignCHR.team  = export33CampaignTeamCHR;

// Push all 33 Export data into the shared arrays
mockUsers.push(...export33Users);
mockCompanies.push(sobragoCompany);
mockProducts.push(...export33Products);
mockZones.push(...gabonZones);
mockCampaigns.push(export33Campaign, export33CampaignCHR);
mockTastings.push(...export33Tastings, ...export33TastingsCHR);
mockSales.push(...export33Sales, ...export33SalesCHR);
mockCampaignTeam.push(...export33CampaignTeam, ...export33CampaignTeamCHR);

// Simple mock auth functions
export const mockAuth = {
  signIn: async (email: string, password: string) => {
    // Mock authentication - accept any email from mockUsers with any password
    const user = mockUsers.find(u => u.email === email);
    if (user) {
      return { user, error: null };
    }
    return { user: null, error: { message: "Email non trouvé" } };
  },
  
  signUp: async (email: string, password: string, fullName: string) => {
    // Mock signup - create a new user
    const newUser: Profile = {
      id: String(mockUsers.length + 1),
      email,
      full_name: fullName,
      role: "hostess",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockUsers.push(newUser);
    return { user: newUser, error: null };
  },
  
  signOut: async () => {
    return { error: null };
  },
};
