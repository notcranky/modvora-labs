import type { IntakeData } from './types'

// Specific product options shown when a user drills into a part

export interface SpecificProduct {
  id: string
  name: string
  brand: string
  priceRange: { min: number; max: number }
  description: string
  compatibility: string
  difficulty: 'bolt-on' | 'moderate' | 'advanced' | 'professional'
  timeToInstall: string
  gainEstimate?: string
  tags: string[]
  searchQuery: string
  retailers: { name: string; icon: string; url: string }[]
}

export interface PartDetail {
  partId: string
  title: string
  icon: string
  intro: string
  products: SpecificProduct[]
}

// ── URL helpers ────────────────────────────────────────────────────────────────
// Summit Racing: exact phrase + vehicle filters to get users to the intended product faster
const SUMMIT_V = (q: string) =>
  `https://www.summitracing.com/search?searchterm=${encodeURIComponent(`"${q}"`)}&vehicleYear={year}&vehicleMake={make}&vehicleModel={model}&SortBy=Default&SortOrder=Ascending`

// eBay Motors: strict exact-match query (quoted product name + vehicle), new listings only
const EBAY_V = (q: string) =>
  `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(`"${q}"`)}+%22{year}%22+%22{make}%22+%22{model}%22&_sacat=33743&LH_ItemCondition=1000&LH_BIN=1&LH_TitleDesc=1&_sop=15`

// JEGS: exact phrase + vehicle terms to reduce broad matches
const JEGS_V = (q: string) =>
  `https://www.jegs.com/webapp/wcs/stores/servlet/SearchResultsPageCmd?Ntt=${encodeURIComponent(`"${q}"`)}+%22{year}%22+%22{make}%22+%22{model}%22`

type VehiclePartOverride = {
  summitPartNumber?: string
  jegsPartNumber?: string
  amazonAsin?: string
  ebayItemId?: string
  directUrlByRetailerName?: Record<string, string>
}

// Start with an empty map and fill exact part numbers over time.
// This is where you can pin true one-click SKU links for this vehicle.
const DURANGO_2014_LIMITED_PART_MAP: Record<string, VehiclePartOverride> = {}

function hydrateTemplate(url: string, intake: IntakeData): string {
  return url
    .replace(/{year}/g, encodeURIComponent(intake.year))
    .replace(/{make}/g, encodeURIComponent(intake.make))
    .replace(/{model}/g, encodeURIComponent(intake.model))
}

function normalizeVehicleToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export function isDurango2014Limited(intake: IntakeData): boolean {
  const year = normalizeVehicleToken(intake.year)
  const make = normalizeVehicleToken(intake.make)
  const model = normalizeVehicleToken(intake.model)
  const trim = normalizeVehicleToken(intake.trim)

  return year === '2014' && make === 'dodge' && model === 'durango' && trim.includes('limited')
}

function retailerType(name: string): 'summit' | 'ebay' | 'jegs' | 'amazon' | 'other' {
  const n = name.toLowerCase()
  if (n.includes('summit racing')) return 'summit'
  if (n.includes('ebay')) return 'ebay'
  if (n.includes('jegs')) return 'jegs'
  if (n.includes('amazon')) return 'amazon'
  return 'other'
}

export function resolveRetailerUrl(product: SpecificProduct, retailer: { name: string; url: string }, intake: IntakeData): string {
  const fallback = hydrateTemplate(retailer.url, intake)
  if (!isDurango2014Limited(intake)) {
    return fallback
  }

  const override = DURANGO_2014_LIMITED_PART_MAP[product.id]
  if (override?.directUrlByRetailerName?.[retailer.name]) {
    return override.directUrlByRetailerName[retailer.name]
  }

  const exactPhrase = `${product.brand} ${product.name}`.trim()
  const preciseQuery = product.searchQuery?.trim() || exactPhrase
  const carPhrase = '2014 Dodge Durango Limited'
  const kind = retailerType(retailer.name)
  const lowerName = retailer.name.toLowerCase()

  // Eibach product-family pages don't always provide Durango-specific direct fitment quickly.
  // For this vehicle, route those buttons to a tighter marketplace query instead.
  if (lowerName.includes('eibach')) {
    return `https://www.amazon.com/s?k=${encodeURIComponent(`"${preciseQuery}" "${carPhrase}"`)}&i=automotive`
  }

  if (kind === 'summit') {
    if (override?.summitPartNumber) {
      return `https://www.summitracing.com/parts/${encodeURIComponent(override.summitPartNumber)}`
    }
    // Summit often redirects broad searches to homepage; default to Amazon when no exact Summit SKU is mapped.
    return `https://www.amazon.com/s?k=${encodeURIComponent(`"${preciseQuery}" "${carPhrase}"`)}&i=automotive`
  }

  if (kind === 'ebay') {
    if (override?.ebayItemId) {
      return `https://www.ebay.com/itm/${encodeURIComponent(override.ebayItemId)}`
    }
    return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(`"${preciseQuery}" "${carPhrase}"`)}&_sacat=33743&LH_ItemCondition=1000&LH_BIN=1&LH_TitleDesc=1&_sop=15`
  }

  if (kind === 'jegs') {
    if (override?.jegsPartNumber) {
      return `https://www.jegs.com/i/${encodeURIComponent(override.jegsPartNumber)}`
    }
    return `https://www.amazon.com/s?k=${encodeURIComponent(`"${preciseQuery}" "${carPhrase}"`)}&i=automotive`
  }

  if (kind === 'amazon') {
    if (override?.amazonAsin) {
      return `https://www.amazon.com/dp/${encodeURIComponent(override.amazonAsin)}`
    }
    return `https://www.amazon.com/s?k=${encodeURIComponent(`"${preciseQuery}" "${carPhrase}"`)}&i=automotive`
  }

  return fallback
}

export function resolveRetailerDisplay(
  product: SpecificProduct,
  retailer: { name: string; icon: string },
  intake: IntakeData,
): { name: string; icon: string } {
  if (!isDurango2014Limited(intake)) {
    return retailer
  }

  const override = DURANGO_2014_LIMITED_PART_MAP[product.id]
  const kind = retailerType(retailer.name)
  const lowerName = retailer.name.toLowerCase()

  if (lowerName.includes('eibach')) {
    return {
      name: 'Amazon — Exact Match',
      icon: '🛒',
    }
  }
  if (kind === 'summit' && !override?.summitPartNumber) {
    return {
      name: 'Amazon — Exact Match (your vehicle)',
      icon: '🛒',
    }
  }

  return retailer
}

export const partDetails: PartDetail[] = [

  // ── COLD AIR INTAKE ──────────────────────────────────────────────────────────
  {
    partId: 'cold-air-intake',
    title: 'Cold Air Intakes',
    icon: '🌀',
    intro: 'Cold air intakes are one of the best first mods — easy to install, instantly noticeable throttle response, and a great engine sound upgrade.',
    products: [
      {
        id: 'kn-57-fipk',
        name: '57 Series FIPK Cold Air Intake',
        brand: 'K&N Engineering',
        priceRange: { min: 280, max: 380 },
        description: 'The most popular cold air intake brand. Lifetime washable filter, 50-state legal, guaranteed power gains. K&N\'s fitment tool will confirm the exact kit for your engine.',
        compatibility: 'Vehicle-specific kit — K&N\'s site confirms exact fitment for your year/make/model/engine',
        difficulty: 'bolt-on',
        timeToInstall: '30–60 minutes',
        gainEstimate: '+5–15 hp',
        tags: ['50-State Legal', 'Washable Filter', 'Lifetime Warranty'],
        searchQuery: 'K&N 57 Series FIPK cold air intake',
        retailers: [
          { name: 'Amazon — K&N 57 Series', icon: '🛒', url: 'https://www.amazon.com/s?k=K%26N+57+Series+FIPK+cold+air+intake+{year}+{make}+{model}&i=automotive' },
          { name: 'K&N — Find Exact Fit', icon: '🌐', url: 'https://www.knfilters.com/find-a-filter?type=filtercharger&year={year}&make={make}&model={model}' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('K&N 57 Series cold air intake') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('K&N 57 Series cold air intake') },
        ],
      },
      {
        id: 'aem-brute-force',
        name: 'Brute Force HD Cold Air Intake',
        brand: 'AEM Induction',
        priceRange: { min: 300, max: 420 },
        description: 'AEM\'s Dryflow filter requires no oiling. Their fitment guide shows the exact intake part number for your specific engine.',
        compatibility: 'Model-specific fitment, no modification needed',
        difficulty: 'bolt-on',
        timeToInstall: '30–60 minutes',
        gainEstimate: '+7–18 hp',
        tags: ['Dry Filter', 'No Oiling Needed', 'High Flow'],
        searchQuery: 'AEM Brute Force cold air intake',
        retailers: [
          { name: 'Amazon — AEM Brute Force', icon: '🛒', url: 'https://www.amazon.com/s?k=AEM+Brute+Force+cold+air+intake+{year}+{make}+{model}&i=automotive' },
          { name: 'AEM — Search Intakes', icon: '🌐', url: 'https://www.aemintakes.com/search?search_query={year}+{make}+{model}+intake' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('AEM Brute Force cold air intake') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('AEM Brute Force cold air intake') },
        ],
      },
      {
        id: 'injen-sp',
        name: 'SP Series Cold Air Intake',
        brand: 'Injen Technology',
        priceRange: { min: 260, max: 370 },
        description: 'CARB-legal intake with SuperNano-Web dry filter. Injen\'s product catalog filters directly to your vehicle.',
        compatibility: 'Dyno-tested fitment for your specific engine',
        difficulty: 'bolt-on',
        timeToInstall: '45–75 minutes',
        gainEstimate: '+6–14 hp',
        tags: ['CARB Legal', 'Dry Filter', 'Turbo Friendly'],
        searchQuery: 'Injen SP cold air intake',
        retailers: [
          { name: 'Amazon — Injen SP Intake', icon: '🛒', url: 'https://www.amazon.com/s?k=Injen+SP+Series+cold+air+intake+{year}+{make}+{model}&i=automotive' },
          { name: 'Injen — Vehicle Selector', icon: '🌐', url: 'https://injen.com/collections/cold-air-intakes?q={year}+{make}+{model}' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Injen SP cold air intake') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Injen SP cold air intake') },
        ],
      },
      {
        id: 'afe-momentum',
        name: 'Momentum GT Cold Air Intake',
        brand: 'aFe Power',
        priceRange: { min: 320, max: 480 },
        description: 'Premium aluminum intake with triple-layer Pro DRY S filter. aFe\'s vehicle selector narrows directly to your engine\'s kit.',
        compatibility: 'Direct-fit replacement, retains factory sensors',
        difficulty: 'bolt-on',
        timeToInstall: '45–90 minutes',
        gainEstimate: '+10–20 hp',
        tags: ['Pro Dry S Filter', 'Aluminum Tube', 'Premium'],
        searchQuery: 'aFe Momentum GT cold air intake',
        retailers: [
          { name: 'Amazon — aFe Momentum GT', icon: '🛒', url: 'https://www.amazon.com/s?k=aFe+Momentum+GT+cold+air+intake+{year}+{make}+{model}&i=automotive' },
          { name: 'aFe Power — Vehicle Search', icon: '🌐', url: 'https://afepower.com/search?q={year}+{make}+{model}+momentum+intake' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('aFe Momentum GT cold air intake') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('aFe Momentum GT cold air intake') },
        ],
      },
    ],
  },

  // ── CAT-BACK EXHAUST ─────────────────────────────────────────────────────────
  {
    partId: 'catback-exhaust',
    title: 'Cat-Back Exhaust Systems',
    icon: '💨',
    intro: 'A cat-back exhaust replaces everything from the catalytic converter back. The biggest sound upgrade you can make — and adds real horsepower.',
    products: [
      {
        id: 'borla-atak',
        name: 'ATAK Cat-Back Exhaust',
        brand: 'Borla',
        priceRange: { min: 900, max: 1600 },
        description: 'Borla\'s most aggressive sound profile. Straight-through stainless design. Borla\'s fitment guide shows your exact part number and price.',
        compatibility: 'Direct bolt-on — Borla\'s site confirms exact kit for your vehicle',
        difficulty: 'moderate',
        timeToInstall: '1–3 hours',
        gainEstimate: '+15–25 hp',
        tags: ['Loudest Option', 'Stainless Steel', 'Lifetime Warranty'],
        searchQuery: 'Borla ATAK cat-back exhaust',
        retailers: [
          { name: 'Amazon — Borla ATAK', icon: '🛒', url: 'https://www.amazon.com/s?k=Borla+ATAK+cat-back+exhaust+{year}+{make}+{model}&i=automotive' },
          { name: 'Borla — Search ATAK Exhausts', icon: '🌐', url: 'https://www.borla.com/search?q={year}+{make}+{model}+ATAK' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Borla ATAK cat-back exhaust') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Borla ATAK cat-back exhaust') },
        ],
      },
      {
        id: 'borla-touring',
        name: 'Touring Cat-Back Exhaust',
        brand: 'Borla',
        priceRange: { min: 800, max: 1400 },
        description: 'Deep, refined exhaust note for daily drivers. Not obnoxious, just right. Borla confirms the exact fit for your car.',
        compatibility: 'Direct bolt-on — vehicle-specific',
        difficulty: 'moderate',
        timeToInstall: '1–3 hours',
        gainEstimate: '+10–20 hp',
        tags: ['Daily Driver Friendly', 'Deep Tone', 'Stainless Steel'],
        searchQuery: 'Borla Touring cat-back exhaust',
        retailers: [
          { name: 'Amazon — Borla Touring', icon: '🛒', url: 'https://www.amazon.com/s?k=Borla+Touring+cat-back+exhaust+{year}+{make}+{model}&i=automotive' },
          { name: 'Borla — Search Touring Exhausts', icon: '🌐', url: 'https://www.borla.com/search?q={year}+{make}+{model}+Touring' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Borla Touring cat-back exhaust') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Borla Touring cat-back exhaust') },
        ],
      },
      {
        id: 'magnaflow-competition',
        name: 'Competition Series Cat-Back',
        brand: 'MagnaFlow',
        priceRange: { min: 700, max: 1200 },
        description: 'Straight-through perforated core. Aggressive but not raspy. MagnaFlow\'s vehicle selector finds your exact system.',
        compatibility: 'Exact vehicle-specific fitment',
        difficulty: 'moderate',
        timeToInstall: '1–2 hours',
        gainEstimate: '+12–22 hp',
        tags: ['Straight-Through', 'No Drone', 'Best Value'],
        searchQuery: 'MagnaFlow Competition cat-back exhaust',
        retailers: [
          { name: 'Amazon — MagnaFlow Competition', icon: '🛒', url: 'https://www.amazon.com/s?k=MagnaFlow+Competition+cat-back+exhaust+{year}+{make}+{model}&i=automotive' },
          { name: 'MagnaFlow — Vehicle Search', icon: '🌐', url: 'https://www.magnaflow.com/search?search={year}+{make}+{model}+exhaust' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('MagnaFlow Competition cat-back') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('MagnaFlow Competition Series cat-back exhaust') },
        ],
      },
      {
        id: 'flowmaster-outlaw',
        name: 'Outlaw Series Cat-Back',
        brand: 'Flowmaster',
        priceRange: { min: 550, max: 950 },
        description: 'Classic American muscle sound. Flowmaster\'s loudest, most aggressive system. Their site shows the exact part for your car.',
        compatibility: 'Vehicle-specific — Flowmaster confirms fitment',
        difficulty: 'moderate',
        timeToInstall: '1–3 hours',
        gainEstimate: '+10–18 hp',
        tags: ['American Muscle Sound', 'Aggressive', 'Budget Friendly'],
        searchQuery: 'Flowmaster Outlaw cat-back',
        retailers: [
          { name: 'Amazon — Flowmaster Outlaw', icon: '🛒', url: 'https://www.amazon.com/s?k=Flowmaster+Outlaw+cat-back+exhaust+{year}+{make}+{model}&i=automotive' },
          { name: 'Flowmaster — Vehicle Search', icon: '🌐', url: 'https://www.flowmastermufflers.com/search?q={year}+{make}+{model}+outlaw+exhaust' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Flowmaster Outlaw cat-back') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Flowmaster Outlaw Series cat-back exhaust') },
        ],
      },
      {
        id: 'corsa-sport',
        name: 'Sport Cat-Back Exhaust',
        brand: 'Corsa Performance',
        priceRange: { min: 1000, max: 1800 },
        description: 'Patented Reflective Sound Cancellation eliminates drone. Corsa\'s fitment guide finds the exact part number and price for your car.',
        compatibility: 'Precision vehicle-specific fitment',
        difficulty: 'moderate',
        timeToInstall: '1–3 hours',
        gainEstimate: '+15–28 hp',
        tags: ['Zero Drone', 'Premium Sound', 'Patented Technology'],
        searchQuery: 'Corsa Sport cat-back exhaust',
        retailers: [
          { name: 'Amazon — Corsa Sport', icon: '🛒', url: 'https://www.amazon.com/s?k=Corsa+Sport+cat-back+exhaust+{year}+{make}+{model}&i=automotive' },
          { name: 'Corsa — Vehicle Search', icon: '🌐', url: 'https://www.corsaperformance.com/search?q={year}+{make}+{model}+exhaust' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Corsa Sport cat-back exhaust') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Corsa Sport cat-back exhaust') },
        ],
      },
    ],
  },

  // ── PERFORMANCE HEADERS ───────────────────────────────────────────────────────
  {
    partId: 'performance-headers',
    title: 'Performance Headers',
    icon: '🔥',
    intro: 'Headers replace the factory exhaust manifold for one of the biggest power gains you can make. Best paired with a cat-back exhaust.',
    products: [
      {
        id: 'long-tube-headers',
        name: 'Long Tube Headers',
        brand: 'Hooker BlackHeart',
        priceRange: { min: 500, max: 1400 },
        description: 'Maximum power gains from full exhaust scavenging. Hooker\'s catalog is filtered to your specific vehicle and engine.',
        compatibility: 'Requires O2 sensor extensions. May require tune. Check emissions laws.',
        difficulty: 'advanced',
        timeToInstall: '4–8 hours',
        gainEstimate: '+20–40 hp',
        tags: ['Max Power', 'Tune Recommended', 'Race Use'],
        searchQuery: 'Hooker BlackHeart long tube headers',
        retailers: [
          { name: 'Hooker — Browse Headers for My Vehicle', icon: '🌐', url: 'https://www.holley.com/brands/hooker/headers/?vehicleYear={year}&vehicleMake={make}&vehicleModel={model}' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Hooker long tube headers') },
          { name: 'JEGS (your vehicle)', icon: '🏎️', url: JEGS_V('long tube headers') },
        ],
      },
      {
        id: 'shorty-headers',
        name: 'Shorty Headers',
        brand: 'BBK Performance',
        priceRange: { min: 250, max: 700 },
        description: 'Street-legal short tube headers. BBK\'s website shows the exact vehicle-specific part for your engine.',
        compatibility: 'Bolt-on in most cases. No tune required.',
        difficulty: 'moderate',
        timeToInstall: '2–4 hours',
        gainEstimate: '+8–18 hp',
        tags: ['Street Legal', 'No Tune Needed', 'Easier Install'],
        searchQuery: 'BBK Performance shorty headers',
        retailers: [
          { name: 'BBK — Search Shorty Headers', icon: '🌐', url: 'https://www.bbkperformance.com/search?q={year}+{make}+{model}+shorty+headers' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('BBK shorty headers') },
          { name: 'JEGS (your vehicle)', icon: '🏎️', url: JEGS_V('BBK shorty headers') },
        ],
      },
    ],
  },

  // ── COILOVERS ────────────────────────────────────────────────────────────────
  {
    partId: 'coilovers',
    title: 'Coilover Kits',
    icon: '🔩',
    intro: 'Coilovers let you adjust ride height AND stiffness independently. The ultimate suspension upgrade for handling and stance.',
    products: [
      {
        id: 'bc-racing-br',
        name: 'BR Series Coilovers',
        brand: 'BC Racing',
        priceRange: { min: 700, max: 1100 },
        description: 'Most popular coilovers on the market. BC Racing\'s fitment tool confirms the exact kit and part number for your vehicle.',
        compatibility: 'Vehicle-specific application, direct bolt-on',
        difficulty: 'moderate',
        timeToInstall: '3–5 hours',
        gainEstimate: 'Improved handling',
        tags: ['30-Way Adjustable', 'Best Value', 'Lifetime Warranty'],
        searchQuery: 'BC Racing BR Series coilovers',
        retailers: [
          { name: 'BC Racing — Browse Coilovers', icon: '🌐', url: 'https://shop.bcracing-na.com/collections/coilovers' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('BC Racing BR coilovers') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('BC Racing BR Series coilovers') },
        ],
      },
      {
        id: 'kw-v3',
        name: 'Variant 3 (V3) Coilovers',
        brand: 'KW Suspension',
        priceRange: { min: 1400, max: 2600 },
        description: 'German-engineered with independent compression and rebound adjustment. KW\'s product finder confirms the exact V3 kit for your car.',
        compatibility: 'Direct-fit, TÜV certified',
        difficulty: 'moderate',
        timeToInstall: '3–5 hours',
        gainEstimate: 'Max handling improvement',
        tags: ['Independent Adjustment', 'TÜV Certified', 'Street + Track'],
        searchQuery: 'KW Variant 3 coilovers',
        retailers: [
          { name: 'KW — Vehicle Finder', icon: '🌐', url: 'https://www.kwsuspensions.net/vehicles/' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('KW Variant 3 coilovers') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('KW Variant 3 V3 coilovers') },
        ],
      },
      {
        id: 'tein-flex-z',
        name: 'Flex Z Coilovers',
        brand: 'Tein',
        priceRange: { min: 500, max: 900 },
        description: 'EDFC-compatible coilovers with 16-way damping. Tein\'s search confirms the exact Flex Z kit for your vehicle.',
        compatibility: 'Model-specific fitment',
        difficulty: 'moderate',
        timeToInstall: '3–5 hours',
        gainEstimate: 'Better handling & stance',
        tags: ['16-Way Damping', 'EDFC Compatible', 'Budget Friendly'],
        searchQuery: 'Tein Flex Z coilovers',
        retailers: [
          { name: 'Tein — Flex Z Product Family', icon: '🌐', url: 'https://www.tein.com/products/flex_z.html' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Tein Flex Z coilovers') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Tein Flex Z coilovers') },
        ],
      },
      {
        id: 'stance-xr1',
        name: 'XR1 Street Coilovers',
        brand: 'Stance Suspension',
        priceRange: { min: 550, max: 850 },
        description: '36-way damping adjustment, good street manners with improved track capability.',
        compatibility: 'Vehicle-specific, direct replacement',
        difficulty: 'moderate',
        timeToInstall: '3–5 hours',
        gainEstimate: 'Improved cornering',
        tags: ['36-Way Damping', 'Street Friendly', 'Value Pick'],
        searchQuery: 'Stance XR1 coilovers',
        retailers: [
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Stance XR1 coilovers') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Stance XR1 Street coilovers') },
          { name: 'JEGS (your vehicle)', icon: '🏎️', url: JEGS_V('Stance XR1 coilovers') },
        ],
      },
    ],
  },

  // ── LOWERING SPRINGS ─────────────────────────────────────────────────────────
  {
    partId: 'lowering-springs',
    title: 'Lowering Springs',
    icon: '⬇️',
    intro: 'Lowering springs drop ride height and improve handling using your factory shocks — no full suspension rebuild needed.',
    products: [
      {
        id: 'eibach-pro-kit',
        name: 'Pro-Kit Lowering Springs',
        brand: 'Eibach',
        priceRange: { min: 200, max: 400 },
        description: 'The most popular lowering springs in the world. Eibach\'s product search finds the exact Pro-Kit part number for your year, make, and model.',
        compatibility: 'Vehicle-specific, works with OEM shocks',
        difficulty: 'moderate',
        timeToInstall: '2–4 hours',
        gainEstimate: '1–1.5" drop',
        tags: ['OEM Shock Compatible', 'Smooth Ride', 'Most Popular'],
        searchQuery: 'Eibach Pro-Kit lowering springs',
        retailers: [
          { name: 'Eibach — Pro-Kit Springs', icon: '🌐', url: 'https://eibach.com/products/pro-kit' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Eibach Pro-Kit lowering springs') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Eibach Pro-Kit lowering springs') },
        ],
      },
      {
        id: 'eibach-sportline',
        name: 'Sportline Lowering Springs',
        brand: 'Eibach',
        priceRange: { min: 220, max: 420 },
        description: 'More aggressive 1.5–2.5" drop. Eibach\'s site shows the exact Sportline part number for your car.',
        compatibility: 'Verify compatibility with your OEM shocks',
        difficulty: 'moderate',
        timeToInstall: '2–4 hours',
        gainEstimate: '1.5–2.5" drop',
        tags: ['Aggressive Drop', 'Sporty Handling', 'Stiffer Rate'],
        searchQuery: 'Eibach Sportline lowering springs',
        retailers: [
          { name: 'Eibach — Sportline Springs', icon: '🌐', url: 'https://eibach.com/products/sportline' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Eibach Sportline lowering springs') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Eibach Sportline lowering springs') },
        ],
      },
      {
        id: 'h-r-sport-springs',
        name: 'Sport Lowering Springs',
        brand: 'H&R Springs',
        priceRange: { min: 180, max: 350 },
        description: 'TÜV-certified German-engineered sport springs with progressive rate.',
        compatibility: 'Direct-fit replacement, TÜV certified',
        difficulty: 'moderate',
        timeToInstall: '2–4 hours',
        gainEstimate: '1–2" drop',
        tags: ['TÜV Certified', 'Progressive Rate', 'German Engineering'],
        searchQuery: 'H&R Sport lowering springs',
        retailers: [
          { name: 'H&R — Sport Springs', icon: '🌐', url: 'https://hrsprings.com/products/sport-springs/' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('H&R Sport lowering springs') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('H&R Sport lowering springs') },
        ],
      },
    ],
  },

  // ── SWAY BARS ────────────────────────────────────────────────────────────────
  {
    partId: 'sway-bars',
    title: 'Performance Sway Bars',
    icon: '↔️',
    intro: 'Upgraded sway bars reduce body roll dramatically. One of the best handling improvements per dollar.',
    products: [
      {
        id: 'whiteline-sway-bar',
        name: 'Heavy Duty Adjustable Sway Bar',
        brand: 'Whiteline',
        priceRange: { min: 180, max: 350 },
        description: 'Hollow steel sway bars with adjustable end links. Whiteline\'s vehicle selector finds the exact bar for your front or rear.',
        compatibility: 'Vehicle-specific, direct replacement',
        difficulty: 'moderate',
        timeToInstall: '1–3 hours',
        tags: ['Adjustable', 'Front & Rear Available', 'Best Value'],
        searchQuery: 'Whiteline adjustable sway bar',
        retailers: [
          { name: 'Whiteline — Browse Sway Bars for My Vehicle', icon: '🌐', url: 'https://www.whiteline.com.au/vehicle-selector?year={year}&make={make}&model={model}&category=sway-bars' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Whiteline sway bar') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Whiteline adjustable sway bar') },
        ],
      },
      {
        id: 'eibach-anti-roll',
        name: 'Anti-Roll Kit Sway Bars',
        brand: 'Eibach',
        priceRange: { min: 250, max: 500 },
        description: 'Front and rear sway bar kit with sport-tuned rates. Eibach\'s site shows the exact kit part number for your vehicle.',
        compatibility: 'Bolt-on direct replacement',
        difficulty: 'moderate',
        timeToInstall: '2–4 hours',
        tags: ['F+R Kit Available', 'Sport Tuned', 'Eibach Quality'],
        searchQuery: 'Eibach Anti-Roll sway bar',
        retailers: [
          { name: 'Eibach — Anti-Roll Kit', icon: '🌐', url: 'https://eibach.com/products/anti-roll-kit' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Eibach Anti-Roll sway bar kit') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Eibach Anti-Roll Kit sway bar') },
        ],
      },
    ],
  },

  // ── BRAKE PADS ───────────────────────────────────────────────────────────────
  {
    partId: 'performance-brake-pads',
    title: 'Performance Brake Pads',
    icon: '🛑',
    intro: 'Upgraded pads give shorter stops, better fade resistance, and improved pedal feel. The easiest safety upgrade you can make.',
    products: [
      {
        id: 'powerstop-z23',
        name: 'Z23 Evolution Sport Brake Pads',
        brand: 'PowerStop',
        priceRange: { min: 50, max: 120 },
        description: 'Carbon-fiber ceramic compound with low dust and cold bite. PowerStop\'s fitment guide shows the exact Z23 pads for your axle and caliper.',
        compatibility: 'Vehicle-specific, direct replacement',
        difficulty: 'bolt-on',
        timeToInstall: '30–60 min per axle',
        tags: ['Low Dust', 'Street & Track', 'Best Value'],
        searchQuery: 'PowerStop Z23 Evolution brake pads',
        retailers: [
          { name: 'Amazon — PowerStop Z23', icon: '🛒', url: 'https://www.amazon.com/s?k=PowerStop+Z23+Evolution+brake+pads+{year}+{make}+{model}&i=automotive' },
          { name: 'PowerStop — Brake Finder', icon: '🌐', url: 'https://www.powerstop.com/brake-kits/' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('PowerStop Z23 Evolution brake pads') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('PowerStop Z23 Evolution Sport brake pads') },
        ],
      },
      {
        id: 'ebc-greenstuff',
        name: 'Greenstuff Street Brake Pads',
        brand: 'EBC Brakes',
        priceRange: { min: 60, max: 130 },
        description: 'High-friction, virtually dust-free, excellent cold bite. EBC\'s brake selector finds the exact Greenstuff compound for your calipers.',
        compatibility: 'Direct OEM replacement',
        difficulty: 'bolt-on',
        timeToInstall: '30–60 min per axle',
        tags: ['Dust Free', 'Cold Bite', 'Street Focused'],
        searchQuery: 'EBC Greenstuff brake pads',
        retailers: [
          { name: 'EBC — Search Brake Pads', icon: '🌐', url: 'https://www.ebcbrakes.com/products/?s={year}+{make}+{model}' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('EBC Greenstuff brake pads') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('EBC Greenstuff Street brake pads') },
        ],
      },
      {
        id: 'ebc-yellowstuff',
        name: 'Yellowstuff Track Brake Pads',
        brand: 'EBC Brakes',
        priceRange: { min: 80, max: 160 },
        description: 'Race-compound pads for track days and aggressive driving. EBC\'s selector confirms the exact Yellowstuff set for your calipers.',
        compatibility: 'Direct replacement, check rotor condition',
        difficulty: 'bolt-on',
        timeToInstall: '30–60 min per axle',
        tags: ['Track Ready', 'High Temp', 'Race Compound'],
        searchQuery: 'EBC Yellowstuff track brake pads',
        retailers: [
          { name: 'EBC — Search Brake Pads', icon: '🌐', url: 'https://www.ebcbrakes.com/products/?s={year}+{make}+{model}' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('EBC Yellowstuff brake pads') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('EBC Yellowstuff Track brake pads') },
        ],
      },
      {
        id: 'hawk-hps',
        name: 'HPS Street Brake Pads',
        brand: 'Hawk Performance',
        priceRange: { min: 65, max: 140 },
        description: '40% more bite than OEM. Hawk\'s lookup tool finds the exact HPS pads for your year, make, model, and position (front/rear).',
        compatibility: 'Direct OEM replacement',
        difficulty: 'bolt-on',
        timeToInstall: '30–60 min per axle',
        tags: ['40% More Bite', 'Low Fade', 'Most Popular'],
        searchQuery: 'Hawk HPS brake pads',
        retailers: [
          { name: 'Amazon — Hawk HPS', icon: '🛒', url: 'https://www.amazon.com/s?k=Hawk+HPS+Street+brake+pads+{year}+{make}+{model}&i=automotive' },
          { name: 'Hawk — Search HPS Pads', icon: '🌐', url: 'https://www.hawkperformance.com/products/hps' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Hawk HPS brake pads') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Hawk HPS Street brake pads') },
        ],
      },
    ],
  },

  // ── BIG BRAKE KIT ────────────────────────────────────────────────────────────
  {
    partId: 'big-brake-kit',
    title: 'Big Brake Kits',
    icon: '🔴',
    intro: 'Big brake kits replace your entire brake setup with larger rotors and multi-piston calipers for dramatically improved stopping power.',
    products: [
      {
        id: 'powerstop-bbk',
        name: 'Z36 Truck & Tow Brake Kit',
        brand: 'PowerStop',
        priceRange: { min: 300, max: 600 },
        description: 'Drilled/slotted rotors + Z36 carbon-ceramic pads as a complete kit. PowerStop\'s fitment guide shows the exact kit part number for your vehicle.',
        compatibility: 'Vehicle-specific complete kit',
        difficulty: 'moderate',
        timeToInstall: '2–4 hours',
        tags: ['Complete Kit', 'Drilled & Slotted', 'Truck/SUV Focused'],
        searchQuery: 'PowerStop Z36 brake kit',
        retailers: [
          { name: 'Amazon — PowerStop Z36', icon: '🛒', url: 'https://www.amazon.com/s?k=PowerStop+Z36+brake+kit+{year}+{make}+{model}&i=automotive' },
          { name: 'PowerStop — Z36 Kit Finder', icon: '🌐', url: 'https://www.powerstop.com/product-category/z36-truck-tow-brake-kit/' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('PowerStop Z36 truck tow brake kit') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('PowerStop Z36 Truck Tow brake kit') },
        ],
      },
      {
        id: 'wilwood-6-piston',
        name: '6-Piston Big Brake Kit',
        brand: 'Wilwood Engineering',
        priceRange: { min: 1200, max: 2800 },
        description: 'Race-proven forged billet aluminum 6-piston calipers. Wilwood\'s catalog is vehicle-filtered to show only kits with correct rotor sizing for your wheels.',
        compatibility: 'Verify wheel clearance — Wilwood\'s site confirms fitment',
        difficulty: 'professional',
        timeToInstall: '4–8 hours',
        gainEstimate: 'Max braking force',
        tags: ['6-Piston Caliper', 'Track Grade', 'Race Proven'],
        searchQuery: 'Wilwood 6-piston big brake kit',
        retailers: [
          { name: 'Wilwood — Search Brake Kits', icon: '🌐', url: 'https://www.wilwood.com/Search?keywords={year}+{make}+{model}' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Wilwood 6-piston big brake kit') },
          { name: 'JEGS (your vehicle)', icon: '🏎️', url: JEGS_V('Wilwood big brake kit') },
        ],
      },
    ],
  },

  // ── AFTERMARKET WHEELS ───────────────────────────────────────────────────────
  {
    partId: 'aftermarket-wheels',
    title: 'Aftermarket Wheels',
    icon: '⭕',
    intro: 'Aftermarket wheels transform the look and can reduce unsprung weight. Always confirm bolt pattern, offset, and center bore for your car.',
    products: [
      {
        id: 'enkei-rpf1',
        name: 'RPF1 Racing Wheel',
        brand: 'Enkei',
        priceRange: { min: 200, max: 350 },
        description: 'One of the lightest production wheels ever made. MAT process forging. Enkei\'s fitment tool shows exactly which size and bolt pattern fits your car.',
        compatibility: 'Multiple bolt patterns — Enkei\'s site confirms fitment',
        difficulty: 'bolt-on',
        timeToInstall: '30–60 minutes',
        tags: ['Extremely Light', 'MAT Forged', 'Track Proven'],
        searchQuery: 'Enkei RPF1 wheels',
        retailers: [
          { name: 'Enkei — RPF1 Wheel Page', icon: '🌐', url: 'https://enkei.com/shop/wheels/racing/rpf1/' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Enkei RPF1 wheels') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Enkei RPF1 wheels') },
        ],
      },
      {
        id: 'konig-hypergram',
        name: 'Hypergram Wheel',
        brand: 'Konig',
        priceRange: { min: 140, max: 260 },
        description: 'Flow-formed lightweight wheel. Nearly as light as forged at a fraction of the cost.',
        compatibility: 'Multiple bolt patterns available — verify offset',
        difficulty: 'bolt-on',
        timeToInstall: '30–60 minutes',
        tags: ['Flow Formed', 'Budget Pick', 'Lightweight'],
        searchQuery: 'Konig Hypergram wheels',
        retailers: [
          { name: 'Konig — Hypergram Wheel Page', icon: '🌐', url: 'https://konigwheels.com/products/konig-hypergram/' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Konig Hypergram wheels') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Konig Hypergram wheels') },
          { name: 'JEGS (your vehicle)', icon: '🏎️', url: JEGS_V('Konig Hypergram wheels') },
        ],
      },
      {
        id: 'volk-te37',
        name: 'TE37 SL Forged Wheel',
        brand: 'Volk Racing (RAYS)',
        priceRange: { min: 500, max: 900 },
        description: 'The most iconic JDM wheel ever made. Forged 6061 aluminum, incredibly light.',
        compatibility: 'Multiple fitments — measure hub and offset carefully',
        difficulty: 'bolt-on',
        timeToInstall: '30–60 minutes',
        tags: ['Forged', 'Iconic Design', 'JDM Legend'],
        searchQuery: 'Volk Racing RAYS TE37 SL wheels',
        retailers: [
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Volk Racing RAYS TE37 SL wheels') },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('RAYS Volk TE37 wheels') },
          { name: 'JEGS (your vehicle)', icon: '🏎️', url: JEGS_V('Volk TE37 wheels') },
        ],
      },
      {
        id: 'method-305-nv',
        name: 'MR305 NV Wheel',
        brand: 'Method Race Wheels',
        priceRange: { min: 230, max: 380 },
        description: 'Aggressive 5-spoke popular on trucks and SUVs. Method\'s site filters to exactly which sizes work for your bolt pattern.',
        compatibility: 'Multiple bolt patterns including 6-lug trucks',
        difficulty: 'bolt-on',
        timeToInstall: '30–60 minutes',
        tags: ['Truck & SUV', 'Aggressive Look', 'Durable'],
        searchQuery: 'Method Race Wheels MR305',
        retailers: [
          { name: 'Method — Search MR305 Fitments', icon: '🌐', url: 'https://www.methodracewheels.com/search?type=product&q=MR305+{make}+{model}' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Method Race Wheels MR305 NV') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Method Race Wheels MR305 NV') },
        ],
      },
    ],
  },

  // ── PERFORMANCE TIRES ────────────────────────────────────────────────────────
  {
    partId: 'performance-tires',
    title: 'Performance Tires',
    icon: '🏎️',
    intro: 'Tires are the most important performance part on your car. The right tire transforms braking, handling, and acceleration.',
    products: [
      {
        id: 'michelin-ps4s',
        name: 'Pilot Sport 4S',
        brand: 'Michelin',
        priceRange: { min: 200, max: 400 },
        description: 'The benchmark ultra-high performance street tire. Michelin\'s site shows the available sizes and prices for your specific wheel diameter.',
        compatibility: 'Available in most popular sizes — verify your current tire size',
        difficulty: 'bolt-on',
        timeToInstall: 'Professional mount & balance recommended',
        tags: ['Best Street Tire', 'Wet + Dry Grip', 'Long Lasting'],
        searchQuery: 'Michelin Pilot Sport 4S',
        retailers: [
          { name: 'Amazon — Michelin PS4S', icon: '🛒', url: 'https://www.amazon.com/s?k=Michelin+Pilot+Sport+4S+tires&i=automotive' },
          { name: 'Tire Rack — PS4S Finder', icon: '🌐', url: 'https://www.tirerack.com/tires/TireSearchResults.jsp?make={make}&model={model}&tireBrand=Michelin&partialModelName=Pilot+Sport+4S' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Michelin Pilot Sport 4S tires') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Michelin Pilot Sport 4S tires') },
        ],
      },
      {
        id: 'nitto-nt05',
        name: 'NT05 Max Performance Tire',
        brand: 'Nitto',
        priceRange: { min: 150, max: 300 },
        description: 'Extreme dry grip. Nitto\'s site shows the available NT05 sizes and which fit your wheels.',
        compatibility: 'Wide range of sizes — verify your wheel size',
        difficulty: 'bolt-on',
        timeToInstall: 'Professional mount & balance recommended',
        tags: ['Track Focused', 'Best Dry Grip', 'Budget Performance'],
        searchQuery: 'Nitto NT05 tires',
        retailers: [
          { name: 'Nitto — Find My Size', icon: '🌐', url: 'https://www.nittotire.com/search/?query=NT05' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Nitto NT05 tires') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Nitto NT05 tires') },
        ],
      },
      {
        id: 'continental-extremecontact',
        name: 'ExtremeContact Sport 02',
        brand: 'Continental',
        priceRange: { min: 160, max: 320 },
        description: 'Excellent wet and dry performance. Continental\'s site filters to sizes that fit your wheels.',
        compatibility: 'Most popular sizes available',
        difficulty: 'bolt-on',
        timeToInstall: 'Professional mount & balance recommended',
        tags: ['Wet + Dry', 'Short Braking', 'All-Season Option'],
        searchQuery: 'Continental ExtremeContact Sport 02',
        retailers: [
          { name: 'Discount Tire — Search This Tire', icon: '🌐', url: 'https://www.discounttire.com/search?text=Continental+ExtremeContact+Sport+02' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Continental ExtremeContact Sport 02 tires') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Continental ExtremeContact Sport 02 tires') },
        ],
      },
    ],
  },

  // ── FRONT LIP / SPLITTER ─────────────────────────────────────────────────────
  {
    partId: 'front-lip-splitter',
    title: 'Front Lips & Splitters',
    icon: '🔲',
    intro: 'Front lips and splitters add aggressive styling and generate downforce at speed.',
    products: [
      {
        id: 'apr-carbon-splitter',
        name: 'Carbon Fiber Front Splitter',
        brand: 'APR Performance',
        priceRange: { min: 400, max: 900 },
        description: 'Real carbon fiber aerodynamic splitter. APR\'s catalog filters to vehicle-specific splitters for your bumper style.',
        compatibility: 'Vehicle-specific — APR confirms bumper compatibility',
        difficulty: 'moderate',
        timeToInstall: '1–3 hours',
        tags: ['Real Carbon Fiber', 'Downforce', 'Premium Look'],
        searchQuery: 'APR Performance carbon fiber front splitter',
        retailers: [
          { name: 'APR — Search Front Splitters', icon: '🌐', url: 'https://shop.aprperformance.com/search?type=product&q={year}+{make}+{model}+front+splitter' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('APR carbon fiber front splitter') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('APR Performance carbon fiber front splitter') },
        ],
      },
      {
        id: 'duraflex-lip',
        name: 'Polyurethane Front Lip',
        brand: 'Duraflex',
        priceRange: { min: 100, max: 280 },
        description: 'Flexible PU — won\'t crack on curbs. Duraflex lists vehicle-specific lip styles for your exact bumper.',
        compatibility: 'Vehicle-specific body style fitment',
        difficulty: 'bolt-on',
        timeToInstall: '1–2 hours',
        tags: ['Flexible PU', 'Budget Friendly', 'Multiple Styles'],
        searchQuery: 'Duraflex front lip spoiler',
        retailers: [
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Duraflex front lip spoiler') },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Duraflex front lip') },
          { name: 'JEGS (your vehicle)', icon: '🏎️', url: JEGS_V('front lip spoiler') },
        ],
      },
    ],
  },

  // ── WINDOW TINT ───────────────────────────────────────────────────────────────
  {
    partId: 'window-tint',
    title: 'Window Tint Film',
    icon: '🌑',
    intro: 'Window tint blocks heat, reduces glare, and gives your car a blacked-out look. Check your state\'s legal VLT before choosing.',
    products: [
      {
        id: 'llumar-ctx',
        name: 'CTX Ceramic Tint Film',
        brand: 'LLumar',
        priceRange: { min: 200, max: 500 },
        description: 'Nano-ceramic film blocks 99% UV and up to 60% heat. Find a certified LLumar installer near you — they cut the film to your exact window shapes.',
        compatibility: 'Professional installation — film is custom-cut to your vehicle\'s windows',
        difficulty: 'professional',
        timeToInstall: '3–5 hours (professional install)',
        tags: ['Ceramic', '99% UV Block', 'Electronics Safe'],
        searchQuery: 'LLumar CTX ceramic window tint',
        retailers: [
          { name: 'Amazon — LLumar CTX Film', icon: '🛒', url: 'https://www.amazon.com/s?k=LLumar+CTX+ceramic+window+tint+film&i=automotive' },
          { name: 'LLumar — Automotive Tint', icon: '🌐', url: 'https://llumar.com/en/products/automotive-window-tint/' },
          { name: 'eBay Motors', icon: '🏷️', url: EBAY_V('LLumar CTX ceramic window tint film') },
          { name: 'Summit Racing', icon: '🏁', url: SUMMIT_V('LLumar window tint film') },
        ],
      },
      {
        id: '3m-crystalline',
        name: 'Crystalline Window Film',
        brand: '3M',
        priceRange: { min: 400, max: 900 },
        description: 'Industry standard nano-carbon ceramic film. Exceptional clarity and heat rejection. Find a 3M authorized shop near you.',
        compatibility: 'Professional installation required — custom-cut to your windows',
        difficulty: 'professional',
        timeToInstall: '3–5 hours (professional install)',
        tags: ['Premium', 'Nano-Carbon', 'Lifetime Warranty'],
        searchQuery: '3M Crystalline window tint film',
        retailers: [
          { name: 'Amazon — 3M Crystalline Film', icon: '🛒', url: 'https://www.amazon.com/s?k=3M+Crystalline+window+tint+film+automotive&i=automotive' },
          { name: '3M — Automotive Films', icon: '🌐', url: 'https://www.3m.com/3M/en_US/window-film-us/products/automotive/' },
          { name: 'eBay Motors', icon: '🏷️', url: EBAY_V('3M Crystalline window tint film') },
          { name: 'Summit Racing', icon: '🏁', url: SUMMIT_V('3M window tint film') },
        ],
      },
      {
        id: 'gila-diy-tint',
        name: 'Heat Shield Window Film',
        brand: 'Gila',
        priceRange: { min: 30, max: 80 },
        description: 'DIY film for budget installs. Universal roll — you cut it to fit.',
        compatibility: 'Universal film — cut to your window shapes',
        difficulty: 'moderate',
        timeToInstall: '2–4 hours DIY',
        tags: ['DIY Friendly', 'Budget Option', 'Heat Blocking'],
        searchQuery: 'Gila Heat Shield window tint film',
        retailers: [
          { name: 'Amazon — Gila DIY Tint', icon: '🛒', url: 'https://www.amazon.com/s?k=Gila+window+tint+film+automotive+DIY&i=automotive' },
          { name: 'Gila — Automotive Tint', icon: '🌐', url: 'https://gilafilms.com/en/automotive-window-tint/' },
          { name: 'eBay Motors', icon: '🏷️', url: EBAY_V('Gila window tint film') },
          { name: 'Summit Racing', icon: '🏁', url: SUMMIT_V('window tint film DIY') },
        ],
      },
    ],
  },

  // ── REAR SPOILER ──────────────────────────────────────────────────────────────
  {
    partId: 'rear-spoiler',
    title: 'Rear Spoilers & Wings',
    icon: '🔺',
    intro: 'Rear spoilers add downforce at speed and transform the look of your car.',
    products: [
      {
        id: 'apr-gt250-wing',
        name: 'GT-250 Carbon Fiber Wing',
        brand: 'APR Performance',
        priceRange: { min: 600, max: 1200 },
        description: 'Real carbon fiber adjustable GT wing. Generates real downforce from 60+ mph. APR lists the correct mounting kit for your trunk.',
        compatibility: 'Universal wing — vehicle-specific mounting bracket required',
        difficulty: 'moderate',
        timeToInstall: '2–4 hours',
        tags: ['Real Carbon', 'Adjustable AoA', 'Downforce'],
        searchQuery: 'APR Performance GT-250 carbon wing',
        retailers: [
          { name: 'APR — Search GT-250 Wing', icon: '🌐', url: 'https://shop.aprperformance.com/search?type=product&q=GT-250+wing' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('APR GT250 carbon wing') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('APR Performance GT-250 carbon wing') },
        ],
      },
      {
        id: 'duraflex-spoiler',
        name: 'OEM Style Trunk Spoiler',
        brand: 'Duraflex',
        priceRange: { min: 80, max: 220 },
        description: 'Vehicle-specific trunk spoilers in polyurethane. Listed per car model so you\'re getting the exact one that mounts on your trunk.',
        compatibility: 'Vehicle-specific fitment',
        difficulty: 'bolt-on',
        timeToInstall: '1–2 hours',
        tags: ['Subtle Style', 'Paint to Match', 'Easy Install'],
        searchQuery: 'Duraflex trunk spoiler',
        retailers: [
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Duraflex trunk lip spoiler') },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Duraflex trunk spoiler') },
          { name: 'JEGS (your vehicle)', icon: '🏎️', url: JEGS_V('trunk lip spoiler') },
        ],
      },
    ],
  },

  // ── LED HEADLIGHTS ───────────────────────────────────────────────────────────
  {
    partId: 'led-headlights',
    title: 'LED Headlights & Lighting',
    icon: '💡',
    intro: 'LED headlights dramatically improve nighttime visibility and give your car a modern look.',
    products: [
      {
        id: 'morimoto-xb-led',
        name: 'XB LED Headlight Assemblies',
        brand: 'Morimoto',
        priceRange: { min: 500, max: 1200 },
        description: 'The best OEM-replacement LED headlight assemblies. Morimoto\'s site shows the exact XB LED assembly part number for your specific vehicle.',
        compatibility: 'Vehicle-specific direct replacement',
        difficulty: 'moderate',
        timeToInstall: '1–2 hours',
        tags: ['Best Output', 'Plug & Play', 'OEM Fit'],
        searchQuery: 'Morimoto XB LED headlights',
        retailers: [
          { name: 'Morimoto — Search XB LED Headlights', icon: '🌐', url: 'https://www.theretrofitsource.com/search?q={year}+{make}+{model}+XB+LED+headlights' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Morimoto XB LED headlights') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Morimoto XB LED headlight assemblies') },
        ],
      },
      {
        id: 'opt7-led-bulbs',
        name: 'FluxBeam LED Headlight Bulb Kit',
        brand: 'OPT7',
        priceRange: { min: 60, max: 130 },
        description: 'Drop-in LED bulbs — 300% brighter. OPT7\'s fitment guide shows exactly which bulb size (H11, 9005, etc.) your vehicle uses.',
        compatibility: 'Check your bulb size — OPT7 shows your exact size',
        difficulty: 'bolt-on',
        timeToInstall: '15–30 minutes',
        tags: ['Drop-In', '300% Brighter', 'Budget Pick'],
        searchQuery: 'OPT7 FluxBeam LED headlight bulbs',
        retailers: [
          { name: 'Amazon — OPT7 FluxBeam', icon: '🛒', url: 'https://www.amazon.com/s?k=OPT7+FluxBeam+LED+headlight+bulbs+{year}+{make}+{model}&i=automotive' },
          { name: 'OPT7 — Search Bulb Kits', icon: '🌐', url: 'https://www.opt7.com/collections/led-headlight-kits' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('OPT7 FluxBeam LED headlight bulbs') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('OPT7 FluxBeam LED headlight bulb kit') },
        ],
      },
      {
        id: 'spyder-led-drl',
        name: 'LED DRL Projector Headlights',
        brand: 'Spyder Auto',
        priceRange: { min: 200, max: 500 },
        description: 'Full LED projector assemblies with DRL halos. Spyder\'s catalog lists the exact assembly for your vehicle by year and model.',
        compatibility: 'Vehicle-specific complete assembly',
        difficulty: 'moderate',
        timeToInstall: '1–2 hours',
        tags: ['DRL Halos', 'Full Assembly', 'Great Value'],
        searchQuery: 'Spyder Auto LED projector headlights',
        retailers: [
          { name: 'Amazon — Spyder Headlights', icon: '🛒', url: 'https://www.amazon.com/s?k=Spyder+Auto+LED+projector+headlights+{year}+{make}+{model}&i=automotive' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Spyder Auto LED projector headlights') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Spyder Auto LED DRL projector headlights') },
        ],
      },
    ],
  },

  // ── SHORT SHIFTER ────────────────────────────────────────────────────────────
  {
    partId: 'short-shifter',
    title: 'Short Throw Shifters',
    icon: '🎮',
    intro: 'A short throw shifter reduces throw distance for faster, more precise shifts. Best mod for manual transmission cars.',
    products: [
      {
        id: 'hurst-short-throw',
        name: 'Competition Plus Short Throw Shifter',
        brand: 'Hurst',
        priceRange: { min: 150, max: 350 },
        description: 'Reduces throw by up to 40%. Hurst\'s catalog shows the exact vehicle-specific Competition Plus kit for your transmission.',
        compatibility: 'Vehicle-specific, manual transmission only',
        difficulty: 'moderate',
        timeToInstall: '2–4 hours',
        tags: ['40% Shorter Throw', 'American Icon', 'Solid Feel'],
        searchQuery: 'Hurst Competition Plus short throw shifter',
        retailers: [
          { name: 'Hurst — Shop My Vehicle', icon: '🌐', url: 'https://www.hurst-shifters.com/search?q={year}+{make}+{model}+competition+plus+shifter' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Hurst Competition Plus short throw shifter') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Hurst Competition Plus short throw shifter') },
        ],
      },
      {
        id: 'cobb-short-shifter',
        name: 'Short Throw Shifter Kit',
        brand: 'Cobb Tuning',
        priceRange: { min: 200, max: 450 },
        description: 'Precision-machined shifter for Subaru, Mazda, and VW platforms. Cobb\'s site shows the exact kit for your vehicle.',
        compatibility: 'Vehicle-specific — best for Subaru, Mazda, VW platforms',
        difficulty: 'moderate',
        timeToInstall: '2–3 hours',
        tags: ['Precision Machined', 'Smooth Engagement', 'JDM Platform'],
        searchQuery: 'Cobb Tuning short throw shifter',
        retailers: [
          { name: 'Cobb — Search Short Shifters', icon: '🌐', url: 'https://www.cobbtuning.com/search/?q={year}+{make}+{model}+short+shifter' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Cobb short throw shifter') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Cobb Tuning short throw shifter') },
        ],
      },
    ],
  },

  // ── PERFORMANCE SEATS ────────────────────────────────────────────────────────
  {
    partId: 'performance-seats',
    title: 'Performance Seats',
    icon: '🪑',
    intro: 'Performance seats keep you planted in corners and look incredible. Require vehicle-specific brackets (usually sold separately).',
    products: [
      {
        id: 'recaro-sport',
        name: 'Sport C Seat',
        brand: 'Recaro',
        priceRange: { min: 700, max: 1400 },
        description: 'The gold standard sport seat. Deep side bolsters, comfortable for daily driving. Recaro\'s site shows compatible seat brackets for your car.',
        compatibility: 'Requires vehicle-specific seat brackets — Recaro lists compatible brackets',
        difficulty: 'moderate',
        timeToInstall: '1–3 hours',
        tags: ['Daily Comfortable', 'Deep Bolsters', 'Recaro Quality'],
        searchQuery: 'Recaro Sport C seat',
        retailers: [
          { name: 'Recaro — Search Sport Seats', icon: '🌐', url: 'https://www.recaro-automotive.com/en/search/?q=Sport%20C' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Recaro Sport C seat') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Recaro Sport C seat') },
        ],
      },
      {
        id: 'corbeau-forza',
        name: 'Forza Sport Seat',
        brand: 'Corbeau',
        priceRange: { min: 350, max: 700 },
        description: 'American-made fiberglass shell sport seat. Corbeau\'s site shows vehicle-specific brackets that bolt this seat directly into your car.',
        compatibility: 'Requires Corbeau brackets — Corbeau\'s site shows your exact bracket',
        difficulty: 'moderate',
        timeToInstall: '1–3 hours',
        tags: ['American Made', 'Lightweight', 'Budget Pick'],
        searchQuery: 'Corbeau Forza sport seat',
        retailers: [
          { name: 'Corbeau — Find My Seat & Bracket', icon: '🌐', url: 'https://www.corbeau.com/seats/?year={year}&make={make}&model={model}' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Corbeau Forza sport seat') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Corbeau Forza sport seat') },
        ],
      },
    ],
  },

  // ── ECU TUNE ─────────────────────────────────────────────────────────────────
  {
    partId: 'ecu-tune',
    title: 'ECU Tunes & Tuning Devices',
    icon: '⚡',
    intro: 'An ECU tune unlocks your engine\'s full potential. The most power per dollar of any mod on a modern car.',
    products: [
      {
        id: 'cobb-accessport',
        name: 'Accessport V3',
        brand: 'Cobb Tuning',
        priceRange: { min: 600, max: 750 },
        description: 'The most popular ECU flash device. Cobb\'s site shows the exact Accessport part number for your specific platform (WRX, STI, Mustang, etc.).',
        compatibility: 'Platform-specific — Cobb confirms your exact part number',
        difficulty: 'bolt-on',
        timeToInstall: '15–30 minutes',
        gainEstimate: '+30–80 hp',
        tags: ['Plug & Play', 'OTS Maps Included', 'Data Logging'],
        searchQuery: 'Cobb Accessport V3',
        retailers: [
          { name: 'Cobb — Search Accessports', icon: '🌐', url: 'https://www.cobbtuning.com/search/?q={year}+{make}+{model}+Accessport' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Cobb Accessport V3') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Cobb Accessport V3') },
        ],
      },
      {
        id: 'hp-tuners',
        name: 'MPVI3 Tuning Interface',
        brand: 'HP Tuners',
        priceRange: { min: 500, max: 900 },
        description: 'Professional-grade tuning for GM, Ford, and Dodge. Industry standard among professional tuners. One device tunes any supported vehicle.',
        compatibility: 'Best for GM/Ford/Dodge/Chrysler — requires a licensed tuner',
        difficulty: 'advanced',
        timeToInstall: 'Requires professional tuner',
        gainEstimate: '+40–100 hp (custom tune)',
        tags: ['Pro Grade', 'Custom Tune', 'GM/Ford/Dodge'],
        searchQuery: 'HP Tuners MPVI3',
        retailers: [
          { name: 'HP Tuners — Buy the MPVI3', icon: '🌐', url: 'https://www.hptuners.com/mpvi3/' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('HP Tuners MPVI3') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('HP Tuners MPVI3 tuning interface') },
        ],
      },
      {
        id: 'diablosport-trinity',
        name: 'Trinity 2 EX Programmer',
        brand: 'DiabloSport',
        priceRange: { min: 400, max: 600 },
        description: 'Pre-loaded performance tunes for Ford, GM, and Dodge. DiabloSport\'s site shows the exact Trinity 2 part number for your engine.',
        compatibility: 'Vehicle-specific — DiabloSport confirms your exact part number',
        difficulty: 'bolt-on',
        timeToInstall: '15–30 minutes',
        gainEstimate: '+20–50 hp',
        tags: ['Touchscreen', 'Pre-Loaded Tunes', 'American V8'],
        searchQuery: 'DiabloSport Trinity 2 EX programmer',
        retailers: [
          { name: 'Amazon — DiabloSport Trinity 2', icon: '🛒', url: 'https://www.amazon.com/s?k=DiabloSport+Trinity+2+EX+programmer+{year}+{make}+{model}&i=automotive' },
          { name: 'DiabloSport — Trinity 2 Search', icon: '🌐', url: 'https://www.diablosport.com/?s={year}+{make}+{model}+trinity+2' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('DiabloSport Trinity 2') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('DiabloSport Trinity 2 EX programmer') },
        ],
      },
    ],
  },

  // ── TURBO KIT ────────────────────────────────────────────────────────────────
  {
    partId: 'turbo-kit',
    title: 'Turbo & Forced Induction Kits',
    icon: '🚀',
    intro: 'Forced induction is the biggest power upgrade possible. Turbo kits and superchargers can double your horsepower. Plan for fuel, tune, and intercooler as supporting mods.',
    products: [
      {
        id: 'precision-turbo-6266',
        name: 'PT6266 CEA Turbocharger',
        brand: 'Precision Turbo & Engine',
        priceRange: { min: 900, max: 1500 },
        description: 'Most popular street/strip turbo. CEA billet compressor wheel, strong spool, massive power. Precision\'s site shows the PT6266 product page directly.',
        compatibility: 'Universal — requires custom manifold, downpipe, and full supporting build',
        difficulty: 'professional',
        timeToInstall: '2–5 days (professional build)',
        gainEstimate: '+150–400 hp',
        tags: ['CEA Billet Wheel', 'Street + Strip', 'USA Made'],
        searchQuery: 'Precision Turbo PT6266',
        retailers: [
          { name: 'Amazon — Precision Turbo PT6266', icon: '🛒', url: 'https://www.amazon.com/s?k=Precision+Turbo+PT6266+CEA+turbocharger&i=automotive' },
          { name: 'Precision Turbo — PT6266', icon: '🌐', url: 'https://www.precisionturbo.com/turbochargers/pt6266' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Precision Turbo PT6266') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Precision Turbo PT6266 CEA turbocharger') },
        ],
      },
      {
        id: 'garrett-gtx3076r',
        name: 'GTX3076R Gen II Turbocharger',
        brand: 'Garrett',
        priceRange: { min: 1200, max: 1900 },
        description: 'Garrett\'s legendary GTX lineup. Ball bearing cartridge, used in serious builds worldwide. Garrett\'s site shows this turbo\'s full spec sheet.',
        compatibility: 'Universal — requires manifold, wastegate, and full system build',
        difficulty: 'professional',
        timeToInstall: '2–5 days (professional build)',
        gainEstimate: '+200–500 hp',
        tags: ['Ball Bearing', 'Legendary Brand', 'Wide Power Range'],
        searchQuery: 'Garrett GTX3076R Gen II',
        retailers: [
          { name: 'Garrett — View the GTX3076R', icon: '🌐', url: 'https://www.turbobygarrett.com/turbobygarrett/catalog/turbocharger/garrett-gtx3076r-gen-ii' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Garrett GTX3076R turbocharger') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Garrett GTX3076R Gen II turbocharger') },
        ],
      },
      {
        id: 'procharger-supercharger',
        name: 'Stage II Intercooled Supercharger',
        brand: 'ProCharger',
        priceRange: { min: 3500, max: 7000 },
        description: 'Complete bolt-on centrifugal supercharger kit. ProCharger\'s site shows vehicle-specific kits — enter your make and model to see the exact kit and price.',
        compatibility: 'Vehicle-specific complete kits — ProCharger confirms your exact kit',
        difficulty: 'advanced',
        timeToInstall: '8–16 hours',
        gainEstimate: '+200–350 hp',
        tags: ['Complete Kit', 'Intercooled', 'Bolt-On Blower'],
        searchQuery: 'ProCharger Stage II supercharger',
        retailers: [
          { name: 'ProCharger — Search Supercharger Kits', icon: '🌐', url: 'https://www.procharger.com/search/?q={make}+{model}+supercharger' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('ProCharger Stage II supercharger kit') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('ProCharger Stage II supercharger kit') },
        ],
      },
      {
        id: 'vortech-v3-supercharger',
        name: 'V-3 Si Supercharger System',
        brand: 'Vortech',
        priceRange: { min: 3000, max: 6500 },
        description: 'Self-contained centrifugal supercharger — no external oil lines. Vortech\'s site shows vehicle-specific kits for your engine.',
        compatibility: 'Vehicle-specific kits — Vortech confirms your exact kit',
        difficulty: 'advanced',
        timeToInstall: '8–16 hours',
        gainEstimate: '+150–300 hp',
        tags: ['Self-Oiling', 'Complete Kit', 'V8 Specialist'],
        searchQuery: 'Vortech V3 Si supercharger',
        retailers: [
          { name: 'Vortech — Search Supercharger Kits', icon: '🌐', url: 'https://vortechsuperchargers.com/search/?q={make}+{model}+supercharger' },
          { name: 'Summit Racing (your vehicle)', icon: '🏁', url: SUMMIT_V('Vortech V3 supercharger kit') },
          { name: 'eBay Motors (your vehicle)', icon: '🏷️', url: EBAY_V('Vortech V3 Si supercharger system') },
        ],
      },
    ],
  },
]
