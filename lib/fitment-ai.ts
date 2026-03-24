import {
  demoParts,
  demoVehicles,
  type DemoVehicle,
  type FitmentDemoCategory,
  type FitmentDemoPart,
  type FitmentIntentType,
  type FitmentResultType,
} from '@/lib/fitment-ai-data'

export type VehicleLookup = {
  year: number
  make: string
  model: string
  trim?: string
  engine?: string
  drivetrain?: string
}

type IntentSubtype =
  | 'interior-led'
  | 'fog-lights'
  | 'headlights'
  | 'tail-lights'
  | 'reverse-lights'
  | 'puddle-lights'
  | 'carplay'
  | 'subwoofer'
  | 'speakers'
  | 'dash-cam'
  | 'backup-camera'
  | 'floor-mats'
  | 'seat-covers'
  | 'sunshade'
  | 'headliner'
  | 'headliner-suede'
  | 'steering-wheel'
  | 'steering-wheel-cover'
  | 'steering-wheel-trim'
  | 'trim-kit'
  | 'dash-cover'
  | 'cargo-cover'
  | 'ambient-lighting'
  | 'hitch'
  | 'roof-rack'
  | 'roof-basket'
  | 'cargo-box'
  | 'cargo-liner'
  | 'cargo-net'
  | 'running-boards'
  | 'brake-controller'
  | 'trailer-wiring'
  | 'brake-pads'
  | 'brake-rotors'
  | 'brake-lines'
  | 'brake-fluid'
  | 'lowering-springs'
  | 'coilovers'
  | 'sway-bars'
  | 'shocks-struts'
  | 'cat-back'
  | 'axle-back'
  | 'intake'
  | 'panel-filter'
  | 'tune'
  | 'wipers'
  | 'cabin-filter'
  | 'engine-air-filter'
  | 'spark-plugs'
  | 'oil-filter'
  | 'battery'
  | 'hood-deflector'
  | 'window-deflectors'
  | 'splash-guards'
  | 'grille'
  | 'mirror-caps'
  | 'license-plate-light'
  | 'wheel-replacement'
  | 'wheel-upgrade'

export type StructuredIntent = {
  categories: FitmentDemoCategory[]
  primaryCategory?: FitmentDemoCategory
  subtype?: IntentSubtype
  requestedSubtypes: IntentSubtype[]
  intentTypes: FitmentIntentType[]
  primaryIntentType: FitmentIntentType
  preferredResultTypes: FitmentResultType[]
  suppressedResultTypes: FitmentResultType[]
  desiredTraits: string[]
  preferredStyleTraits: string[]
  requestedKeywords: string[]
  requestedPhrases: string[]
  exclusions: string[]
  maxBudget?: number
  needsQuiet: boolean
  wantsAggressiveSound: boolean
  requiresExactProductBias: boolean
  explainTokens: string[]
}

export type RankedSearchResult = {
  part: FitmentDemoPart
  score: number
  explanation: string[]
  fitmentNotes: string[]
  source: {
    url?: string
    label: string
    exactness: 'exact-product' | 'vehicle-page' | 'brand-page' | 'lookup'
  }
}

export type SearchAiResponse = {
  vehicle: DemoVehicle | null
  intent: StructuredIntent
  results: RankedSearchResult[]
  warnings: string[]
  constraints: string[]
  vehicleNotes: string[]
}

const CATEGORY_RULES: Array<{ category: FitmentDemoCategory; terms: string[] }> = [
  { category: 'intake', terms: ['intake', 'air intake', 'cold air', 'airbox', 'panel filter', 'drop in filter', 'drop-in filter'] },
  { category: 'exhaust', terms: ['exhaust', 'catback', 'cat-back', 'axle-back', 'muffler'] },
  { category: 'suspension', terms: ['coilover', 'coilovers', 'suspension', 'springs', 'stance', 'lower', 'shocks', 'struts', 'sway bar'] },
  { category: 'brakes', terms: ['brake', 'brakes', 'pads', 'rotor', 'rotors', 'brake lines', 'brake fluid'] },
  { category: 'wheels', terms: ['wheel', 'wheels', 'rim', 'rims', 'tire', 'tires'] },
  { category: 'lighting', terms: ['headlight', 'tail light', 'fog light', 'reverse light', 'interior light', 'ambient lighting', 'puddle light', 'license plate light', 'led'] },
  { category: 'engine', terms: ['engine', 'power', 'horsepower', 'performance', 'tune', 'tuning', 'ecu'] },
  { category: 'aero', terms: ['aero', 'splitter', 'spoiler', 'wing', 'diffuser', 'lip'] },
  { category: 'interior', terms: ['interior', 'inside', 'cabin', 'seat covers', 'floor mats', 'floor liners', 'sunshade', 'headliner', 'steering wheel', 'trim', 'dash cover', 'cargo cover'] },
  { category: 'audio', terms: ['audio', 'stereo', 'speaker', 'speakers', 'subwoofer', 'bass', 'carplay', 'android auto', 'uconnect', 'radio', 'dash cam', 'backup camera'] },
  { category: 'utility', terms: ['utility', 'cargo', 'roof rack', 'crossbars', 'cargo box', 'cargo liner', 'cargo net', 'hitch', 'tow', 'towing', 'bike rack', 'trailer', 'running boards'] },
  { category: 'maintenance', terms: ['maintenance', 'service', 'wiper', 'wipers', 'filter', 'battery', 'spark plugs', 'oil filter', 'replace worn'] },
  { category: 'appearance', terms: ['appearance', 'oem+', 'hood deflector', 'splash guards', 'subtle', 'clean look', 'grille', 'mirror caps', 'window deflectors', 'exterior'] },
]

const TRAIT_TERMS = [
  'sound', 'quiet', 'daily', 'track', 'handling', 'stance', 'street', 'response', 'power', 'lower', 'aggressive', 'appearance', 'lightweight', 'comfort', 'family', 'suv', 'oem+', 'oem plus', 'interior', 'audio', 'cargo', 'tow', 'towing', 'road trip', 'utility', 'practical', 'winter', 'kids', 'brighter', 'visibility', 'louder', 'bass', 'tech', 'comfortable', 'ride', 'luxury', 'subtle', 'factory', 'stock'
]

const SUBTYPE_RULES: Array<{ subtype: IntentSubtype; categories: FitmentDemoCategory[]; phrases: string[]; keywords: string[] }> = [
  { subtype: 'interior-led', categories: ['lighting'], phrases: ['interior led', 'interior leds', 'interior light', 'interior lights', 'cabin led'], keywords: ['interior lights', 'led interior', 'cabin lighting'] },
  { subtype: 'ambient-lighting', categories: ['interior', 'lighting'], phrases: ['ambient light', 'ambient lighting', 'footwell lights', 'interior glow'], keywords: ['ambient lighting', 'ambient light', 'footwell lights'] },
  { subtype: 'puddle-lights', categories: ['lighting', 'appearance'], phrases: ['puddle light', 'puddle lights', 'door light', 'door lights'], keywords: ['puddle lights', 'door lights'] },
  { subtype: 'fog-lights', categories: ['lighting'], phrases: ['fog light', 'fog lights', 'fog lamp', 'fog lamps'], keywords: ['fog lights', 'fog light kit'] },
  { subtype: 'headlights', categories: ['lighting'], phrases: ['headlight', 'headlights', 'headlamp', 'headlamps', 'projector headlights'], keywords: ['headlight', 'headlights', 'projector headlights'] },
  { subtype: 'tail-lights', categories: ['lighting'], phrases: ['tail light', 'tail lights', 'tail lamp', 'tail lamps'], keywords: ['tail lights', 'tail lamp', 'rear lights'] },
  { subtype: 'reverse-lights', categories: ['lighting'], phrases: ['reverse light', 'reverse lights', 'backup light', 'backup lights'], keywords: ['reverse lights', 'backup lights'] },
  { subtype: 'license-plate-light', categories: ['lighting', 'appearance'], phrases: ['license plate light', 'license plate lights', 'tag light', 'tag lights'], keywords: ['license plate lights', 'plate lights'] },
  { subtype: 'carplay', categories: ['audio'], phrases: ['carplay', 'apple carplay', 'android auto', 'uconnect upgrade', 'radio upgrade', 'phone integration'], keywords: ['carplay', 'android auto', 'uconnect', 'radio interface'] },
  { subtype: 'subwoofer', categories: ['audio'], phrases: ['subwoofer', 'more bass', 'better bass'], keywords: ['subwoofer', 'bass'] },
  { subtype: 'speakers', categories: ['audio'], phrases: ['speaker', 'speakers', 'door speakers', 'component speakers', 'dash speakers'], keywords: ['speakers', 'speaker upgrade', 'door speakers', 'dash speakers'] },
  { subtype: 'dash-cam', categories: ['audio', 'interior'], phrases: ['dash cam', 'dashcam'], keywords: ['dash cam', 'dashcam'] },
  { subtype: 'backup-camera', categories: ['audio'], phrases: ['backup camera', 'reverse camera', 'rear camera', 'parking camera'], keywords: ['backup camera', 'reverse camera'] },
  { subtype: 'floor-mats', categories: ['interior'], phrases: ['floor mat', 'floor mats', 'floor liner', 'floor liners', 'all weather mats', 'carpet mats'], keywords: ['floor mats', 'floor liners', 'carpet mats'] },
  { subtype: 'seat-covers', categories: ['interior'], phrases: ['seat cover', 'seat covers', 'seat protector'], keywords: ['seat covers', 'seat protection'] },
  { subtype: 'sunshade', categories: ['interior'], phrases: ['sunshade', 'windshield shade', 'window shade'], keywords: ['sunshade', 'window shade'] },
  { subtype: 'headliner', categories: ['interior'], phrases: ['headliner', 'roof liner', 'pillar trim'], keywords: ['headliner', 'roof liner', 'pillar trim'] },
  { subtype: 'headliner-suede', categories: ['interior'], phrases: ['suede headliner', 'alcantara headliner', 'micro suede headliner', 'microsuede headliner'], keywords: ['suede headliner', 'alcantara headliner', 'microsuede headliner'] },
  { subtype: 'steering-wheel', categories: ['interior'], phrases: ['new steering wheel', 'replacement steering wheel', 'oem steering wheel', 'steering wheel replacement', 'steering wheel swap', 'steering wheel'], keywords: ['steering wheel', 'replacement steering wheel', 'oem steering wheel'] },
  { subtype: 'steering-wheel-cover', categories: ['interior'], phrases: ['steering wheel cover', 'wheel cover', 'wheel wrap', 'steering wheel wrap', 'wrapped wheel'], keywords: ['steering wheel cover', 'wheel wrap', 'steering wheel wrap'] },
  { subtype: 'steering-wheel-trim', categories: ['interior', 'appearance'], phrases: ['steering wheel trim', 'steering wheel bezel', 'steering wheel accent trim'], keywords: ['steering wheel trim', 'steering wheel bezel', 'steering wheel accent'] },
  { subtype: 'trim-kit', categories: ['interior', 'appearance'], phrases: ['trim kit', 'interior trim', 'dash trim', 'wood trim', 'carbon trim'], keywords: ['trim kit', 'interior trim', 'dash trim', 'carbon trim', 'wood trim'] },
  { subtype: 'dash-cover', categories: ['interior'], phrases: ['dash cover', 'dashboard cover'], keywords: ['dash cover', 'dashboard cover'] },
  { subtype: 'cargo-cover', categories: ['interior', 'utility'], phrases: ['cargo cover', 'privacy cover', 'tonneau cover'], keywords: ['cargo cover', 'privacy cover', 'tonneau cover'] },
  { subtype: 'hitch', categories: ['utility'], phrases: ['hitch', 'receiver hitch', 'trailer hitch', 'tow hitch'], keywords: ['hitch', 'receiver', 'tow hitch'] },
  { subtype: 'roof-rack', categories: ['utility'], phrases: ['roof rack', 'crossbars', 'roof bars'], keywords: ['roof rack', 'crossbars'] },
  { subtype: 'roof-basket', categories: ['utility'], phrases: ['roof basket'], keywords: ['roof basket'] },
  { subtype: 'cargo-box', categories: ['utility'], phrases: ['cargo box', 'roof box'], keywords: ['cargo box', 'roof cargo box'] },
  { subtype: 'cargo-liner', categories: ['utility', 'interior'], phrases: ['cargo liner', 'cargo tray', 'trunk liner', 'cargo mat'], keywords: ['cargo liner', 'cargo tray', 'cargo mat'] },
  { subtype: 'cargo-net', categories: ['utility'], phrases: ['cargo net', 'storage net'], keywords: ['cargo net', 'storage net'] },
  { subtype: 'running-boards', categories: ['utility', 'appearance'], phrases: ['running board', 'running boards', 'side step', 'side steps'], keywords: ['running boards', 'side steps'] },
  { subtype: 'brake-controller', categories: ['utility'], phrases: ['brake controller', 'trailer brake controller'], keywords: ['brake controller', 'trailer brakes'] },
  { subtype: 'trailer-wiring', categories: ['utility'], phrases: ['trailer wiring', 'wiring harness', '4 pin harness', '7 pin harness'], keywords: ['trailer wiring', 'wiring harness', 'tow wiring'] },
  { subtype: 'brake-pads', categories: ['brakes'], phrases: ['brake pad', 'brake pads', 'pad set'], keywords: ['pads', 'brake pads'] },
  { subtype: 'brake-rotors', categories: ['brakes'], phrases: ['brake rotor', 'brake rotors', 'rotor', 'rotors'], keywords: ['rotor', 'rotors'] },
  { subtype: 'brake-lines', categories: ['brakes'], phrases: ['brake lines', 'stainless lines', 'better pedal feel'], keywords: ['brake lines', 'pedal feel'] },
  { subtype: 'brake-fluid', categories: ['brakes', 'maintenance'], phrases: ['brake fluid', 'dot 4'], keywords: ['brake fluid', 'dot 4'] },
  { subtype: 'lowering-springs', categories: ['suspension'], phrases: ['lowering springs', 'lower it', 'drop it'], keywords: ['springs', 'lower', 'stance'] },
  { subtype: 'coilovers', categories: ['suspension'], phrases: ['coilover', 'coilovers'], keywords: ['coilovers', 'height adjustable'] },
  { subtype: 'sway-bars', categories: ['suspension'], phrases: ['sway bar', 'sway bars', 'body roll'], keywords: ['sway bar', 'body roll'] },
  { subtype: 'shocks-struts', categories: ['suspension'], phrases: ['shocks', 'struts', 'ride better', 'ride control', 'comfort refresh'], keywords: ['shock', 'strut', 'ride control', 'comfort'] },
  { subtype: 'cat-back', categories: ['exhaust'], phrases: ['catback', 'cat-back', 'cat back'], keywords: ['catback', 'cat-back exhaust'] },
  { subtype: 'axle-back', categories: ['exhaust'], phrases: ['axle-back', 'axle back'], keywords: ['axle-back', 'axle-back exhaust'] },
  { subtype: 'intake', categories: ['intake'], phrases: ['intake', 'cold air intake', 'air intake'], keywords: ['intake', 'cold air', 'air intake'] },
  { subtype: 'panel-filter', categories: ['intake', 'maintenance'], phrases: ['panel filter', 'drop in filter', 'drop-in filter', 'replacement air filter'], keywords: ['panel filter', 'air filter', 'replacement filter'] },
  { subtype: 'tune', categories: ['engine'], phrases: ['tune', 'tuning', 'ecu tune', 'stage 1', 'flash tune'], keywords: ['tune', 'tuning', 'ecu'] },
  { subtype: 'wipers', categories: ['maintenance'], phrases: ['wiper', 'wipers', 'wiper blades'], keywords: ['wipers', 'wiper blades'] },
  { subtype: 'cabin-filter', categories: ['maintenance'], phrases: ['cabin filter', 'cabin air filter'], keywords: ['cabin filter', 'air quality'] },
  { subtype: 'engine-air-filter', categories: ['maintenance'], phrases: ['engine air filter', 'air filter service'], keywords: ['engine air filter', 'air filter'] },
  { subtype: 'spark-plugs', categories: ['maintenance'], phrases: ['spark plugs', 'spark plug', 'tune up'], keywords: ['spark plugs', 'tune up'] },
  { subtype: 'oil-filter', categories: ['maintenance'], phrases: ['oil filter', 'oil change'], keywords: ['oil filter', 'oil change'] },
  { subtype: 'battery', categories: ['maintenance'], phrases: ['battery', 'agm battery'], keywords: ['battery', 'agm battery'] },
  { subtype: 'hood-deflector', categories: ['appearance'], phrases: ['hood deflector', 'bug shield', 'stone deflector'], keywords: ['hood deflector', 'bug shield'] },
  { subtype: 'window-deflectors', categories: ['appearance'], phrases: ['window deflectors', 'window visors', 'rain guards'], keywords: ['window deflectors', 'rain guards'] },
  { subtype: 'splash-guards', categories: ['appearance'], phrases: ['splash guard', 'splash guards', 'mud flaps', 'mud guards'], keywords: ['splash guards', 'mud guards', 'mud flaps'] },
  { subtype: 'grille', categories: ['appearance'], phrases: ['grille', 'front grille', 'grill'], keywords: ['grille', 'front grille'] },
  { subtype: 'mirror-caps', categories: ['appearance'], phrases: ['mirror cap', 'mirror caps', 'side mirror cover'], keywords: ['mirror caps', 'mirror covers'] },
  { subtype: 'wheel-replacement', categories: ['wheels'], phrases: ['stock wheel', 'factory wheel', 'oem wheel', 'wheel replacement', 'replacement wheel'], keywords: ['factory wheels', 'oem wheels', 'wheel replacement'] },
  { subtype: 'wheel-upgrade', categories: ['wheels'], phrases: ['new wheels', 'better wheels', 'wheel upgrade', 'aftermarket wheels'], keywords: ['wheel set', 'lightweight', 'appearance'] },
]

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function queryIncludesAny(normalized: string, terms: string[]) {
  return terms.some((term) => normalized.includes(term))
}

function tokenize(text: string) {
  return Array.from(new Set(normalize(text).split(/[^a-z0-9+]+/).filter(Boolean)))
}

function keywordSet(part: FitmentDemoPart) {
  return new Set(part.keywords.map((keyword) => normalize(keyword)))
}

function combinedPartText(part: FitmentDemoPart) {
  return [
    normalize(part.name),
    normalize(part.summary),
    ...part.keywords.map((keyword) => normalize(keyword)),
    ...(part.styleTags ?? []).map((tag) => normalize(tag)),
    ...(part.exactMatchPhrases ?? []).map((phrase) => normalize(phrase)),
  ]
}

function getSubtypeRule(subtype: IntentSubtype) {
  return SUBTYPE_RULES.find((entry) => entry.subtype === subtype)
}

function requestedSubtypeCategories(intent: StructuredIntent) {
  return Array.from(new Set(intent.requestedSubtypes.flatMap((subtype) => getSubtypeRule(subtype)?.categories ?? [])))
}

function derivePrimaryIntentType(normalized: string, requestedSubtypes: Set<IntentSubtype>, desiredTraits: Set<string>): FitmentIntentType {
  if (queryIncludesAny(normalized, ['replace', 'replacement', 'oem', 'factory', 'stock', 'fix', 'repair', 'worn', 'broken'])) return 'replacement'
  if (queryIncludesAny(normalized, ['service', 'maintenance', 'refresh', 'tune up', 'oil change'])) return 'maintenance'
  if (queryIncludesAny(normalized, ['carplay', 'android auto', 'backup camera', 'dash cam', 'tech', 'radio'])) return 'tech'
  if (queryIncludesAny(normalized, ['comfort', 'comfortable', 'cooler', 'shade', 'luxury'])) return 'comfort'
  if (queryIncludesAny(normalized, ['tow', 'towing', 'cargo', 'roof rack', 'crossbars', 'utility'])) return 'utility'
  if (queryIncludesAny(normalized, ['trim', 'style', 'look', 'look better', 'headliner', 'suede', 'ambient', 'cosmetic', 'appearance'])) return 'cosmetic'
  if (requestedSubtypes.has('steering-wheel-cover') || requestedSubtypes.has('ambient-lighting') || requestedSubtypes.has('trim-kit') || requestedSubtypes.has('headliner-suede')) return 'cosmetic'
  if (desiredTraits.has('oem+') || desiredTraits.has('subtle')) return 'cosmetic'
  return 'aftermarket-upgrade'
}

function deriveSecondaryIntentTypes(normalized: string, desiredTraits: Set<string>, categories: Set<FitmentDemoCategory>): FitmentIntentType[] {
  const types = new Set<FitmentIntentType>()
  if (categories.has('maintenance') || queryIncludesAny(normalized, ['service', 'maintenance'])) types.add('maintenance')
  if (categories.has('utility') || queryIncludesAny(normalized, ['tow', 'cargo', 'family', 'road trip'])) types.add('utility')
  if (categories.has('audio') || queryIncludesAny(normalized, ['carplay', 'android auto', 'camera', 'tech'])) types.add('tech')
  if (desiredTraits.has('comfort') || queryIncludesAny(normalized, ['comfortable', 'cooler', 'shade'])) types.add('comfort')
  if (categories.has('appearance') || categories.has('interior') || desiredTraits.has('appearance')) types.add('cosmetic')
  if (categories.has('brakes') || categories.has('suspension') || categories.has('intake') || categories.has('exhaust')) types.add('aftermarket-upgrade')
  return Array.from(types)
}

function deriveIntentFromQuery(query: string): StructuredIntent {
  const normalized = normalize(query)
  const categories = new Set<FitmentDemoCategory>(
    CATEGORY_RULES.filter(({ terms }) => queryIncludesAny(normalized, terms)).map(({ category }) => category),
  )
  const requestedSubtypes = new Set<IntentSubtype>()
  const requestedKeywords = new Set<string>()
  const requestedPhrases = new Set<string>()
  const desiredTraits = new Set<string>(TRAIT_TERMS.filter((term) => normalized.includes(term)))
  const styleTraits = new Set<string>()
  const exclusions = new Set<string>()

  for (const rule of SUBTYPE_RULES) {
    const matchedPhrases = rule.phrases.filter((phrase) => normalized.includes(phrase))
    if (matchedPhrases.length === 0) continue
    requestedSubtypes.add(rule.subtype)
    matchedPhrases.forEach((phrase) => requestedPhrases.add(phrase))
    rule.categories.forEach((category) => categories.add(category))
    rule.keywords.forEach((keyword) => requestedKeywords.add(keyword))
  }

  if (queryIncludesAny(normalized, ['not too loud', 'no drone', 'quiet', 'civil'])) desiredTraits.add('quiet')
  if (queryIncludesAny(normalized, ['oem+', 'oem plus', 'subtle', 'clean look', 'factory look', 'stock look'])) {
    desiredTraits.add('oem+')
    styleTraits.add('subtle')
    styleTraits.add('factory-like')
  }
  if (queryIncludesAny(normalized, ['carbon', 'alcantara', 'suede', 'blackout', 'rgb', 'sporty'])) {
    styleTraits.add('sporty')
    if (normalized.includes('suede') || normalized.includes('alcantara')) styleTraits.add('suede')
    if (normalized.includes('carbon')) styleTraits.add('carbon-look')
    if (normalized.includes('rgb')) styleTraits.add('rgb')
  }
  if (queryIncludesAny(normalized, ['luxury', 'nicer', 'premium'])) styleTraits.add('premium')
  if (queryIncludesAny(normalized, ['replacement', 'replace', 'repair', 'fix', 'worn', 'broken'])) exclusions.add('flashy-upgrade')
  if (queryIncludesAny(normalized, ['aftermarket', 'upgrade', 'better', 'more aggressive', 'sportier'])) exclusions.add('basic-replacement')
  if (queryIncludesAny(normalized, ['interior styling', 'inside look', 'look nicer inside', 'cosmetic'])) exclusions.add('broad-utility')

  if (requestedSubtypes.has('steering-wheel-cover') || requestedSubtypes.has('steering-wheel-trim')) requestedSubtypes.delete('steering-wheel')
  if (requestedSubtypes.has('headliner-suede')) requestedSubtypes.delete('headliner')
  if (requestedSubtypes.has('steering-wheel') || requestedSubtypes.has('steering-wheel-cover') || requestedSubtypes.has('steering-wheel-trim')) {
    categories.delete('wheels')
    categories.add('interior')
  }

  const primaryIntentType = derivePrimaryIntentType(normalized, requestedSubtypes, desiredTraits)
  const intentTypes = Array.from(new Set([primaryIntentType, ...deriveSecondaryIntentTypes(normalized, desiredTraits, categories)]))

  const suppressedResultTypes = new Set<FitmentResultType>()
  const preferredResultTypes = new Set<FitmentResultType>()

  if (primaryIntentType === 'replacement' || primaryIntentType === 'maintenance') {
    preferredResultTypes.add('oem-replacement')
    preferredResultTypes.add('service-item')
    suppressedResultTypes.add('aftermarket-upgrade')
  }
  if (primaryIntentType === 'aftermarket-upgrade') {
    preferredResultTypes.add('aftermarket-upgrade')
    suppressedResultTypes.add('service-item')
    if (queryIncludesAny(normalized, ['aftermarket', 'performance', 'upgrade'])) suppressedResultTypes.add('oem-replacement')
  }
  if (primaryIntentType === 'cosmetic' || primaryIntentType === 'comfort' || primaryIntentType === 'tech' || primaryIntentType === 'utility') {
    preferredResultTypes.add('accessory')
    preferredResultTypes.add('universal')
    if (primaryIntentType === 'tech') preferredResultTypes.add('aftermarket-upgrade')
  }
  if (requestedSubtypes.has('headliner') || requestedSubtypes.has('headliner-suede') || requestedSubtypes.has('steering-wheel') || requestedSubtypes.has('steering-wheel-trim') || requestedSubtypes.has('trim-kit')) {
    suppressedResultTypes.add('service-item')
  }
  if (requestedSubtypes.has('hitch') || requestedSubtypes.has('trailer-wiring') || requestedSubtypes.has('cargo-box') || requestedSubtypes.has('roof-rack')) {
    suppressedResultTypes.add('oem-replacement')
  }

  const budgetMatch = normalized.match(/\$(\d[\d,]*)|under\s+(\d[\d,]*)|below\s+(\d[\d,]*)/)
  const rawBudget = budgetMatch?.slice(1).find(Boolean)?.replace(/,/g, '')
  const maxBudget = rawBudget ? Number(rawBudget) : undefined

  const needsQuiet = ['quiet', 'civil', 'daily', 'not too loud', 'family', 'no drone', 'comfortable'].some((term) => normalized.includes(term))
  const wantsAggressiveSound = ['loud', 'louder', 'aggressive', 'deep', 'track', 'growl'].some((term) => normalized.includes(term))
  const requiresExactProductBias = queryIncludesAny(normalized, ['named', 'exact', 'specific']) || /\b[A-Z]{2,}[- ]?\d{2,}/i.test(query)

  tokenize(query).forEach((token) => requestedKeywords.add(token))
  desiredTraits.forEach((trait) => requestedKeywords.add(trait))
  styleTraits.forEach((trait) => requestedKeywords.add(trait))

  const requestedSubtypeList = Array.from(requestedSubtypes)
  const primaryCategory = requestedSubtypeList[0] ? getSubtypeRule(requestedSubtypeList[0])?.categories[0] : Array.from(categories)[0]

  return {
    categories: Array.from(categories),
    primaryCategory,
    subtype: requestedSubtypeList[0],
    requestedSubtypes: requestedSubtypeList,
    intentTypes,
    primaryIntentType,
    preferredResultTypes: Array.from(preferredResultTypes),
    suppressedResultTypes: Array.from(suppressedResultTypes),
    desiredTraits: Array.from(desiredTraits),
    preferredStyleTraits: Array.from(styleTraits),
    requestedKeywords: Array.from(requestedKeywords),
    requestedPhrases: Array.from(requestedPhrases),
    exclusions: Array.from(exclusions),
    maxBudget,
    needsQuiet,
    wantsAggressiveSound,
    requiresExactProductBias,
    explainTokens: Array.from(new Set([...Array.from(categories), ...Array.from(desiredTraits), ...requestedSubtypeList, ...intentTypes])),
  }
}

function findRequestedSubtypeMatches(part: FitmentDemoPart, intent: StructuredIntent) {
  const haystacks = combinedPartText(part)
  const exactSubtypes: IntentSubtype[] = []
  const keywordSubtypes: IntentSubtype[] = []

  for (const subtype of intent.requestedSubtypes) {
    const rule = getSubtypeRule(subtype)
    if (!rule) continue
    const exactSignals = rule.phrases.filter((phrase) => haystacks.some((value) => value.includes(phrase)))
    if (exactSignals.length > 0) {
      exactSubtypes.push(subtype)
      continue
    }
    const keywordSignals = rule.keywords.filter((keyword) => haystacks.some((value) => value.includes(normalize(keyword))))
    if (keywordSignals.length > 0) keywordSubtypes.push(subtype)
  }

  return { exactSubtypes, keywordSubtypes, allSubtypes: Array.from(new Set([...exactSubtypes, ...keywordSubtypes])) }
}

function inferSourceExactness(part: FitmentDemoPart): RankedSearchResult['source']['exactness'] {
  const label = normalize(part.sourceLabel ?? '')
  const url = normalize(part.sourceUrl ?? '')
  if (label.includes('exact product') || label.includes('exact 2014 durango') || label.includes('exact product listing')) return 'exact-product'
  if (label.includes('vehicle page') || url.includes('/2014/') || url.includes('durango')) return 'vehicle-page'
  if (label.includes('lookup') || label.includes('search') || part.resultType === 'parts-lookup') return 'lookup'
  return 'brand-page'
}

function resolvePartIntentTypes(part: FitmentDemoPart): FitmentIntentType[] {
  if (part.intentTags?.length) return part.intentTags
  switch (part.resultType) {
    case 'service-item':
      return ['maintenance']
    case 'oem-replacement':
      return ['replacement']
    case 'accessory':
      return ['cosmetic', 'comfort', 'utility']
    case 'parts-lookup':
      return ['replacement']
    default:
      return ['aftermarket-upgrade']
  }
}

function partMatchesIntent(part: FitmentDemoPart, intent: StructuredIntent) {
  if (intent.categories.length > 0 && !intent.categories.includes(part.category)) return false
  if (typeof intent.maxBudget === 'number' && part.priceRange.min > intent.maxBudget) return false
  if (intent.needsQuiet && ['high', 'medium-high'].includes(String(part.attributes?.loudness ?? '').toLowerCase())) return false
  return true
}

function scorePart(part: FitmentDemoPart, intent: StructuredIntent) {
  let score = 0
  const explanation: string[] = []
  const partKeywords = keywordSet(part)
  const normalizedName = normalize(part.name)
  const normalizedSummary = normalize(part.summary)
  const sourceExactness = inferSourceExactness(part)
  const subtypeMatches = findRequestedSubtypeMatches(part, intent)
  const partIntentTypes = resolvePartIntentTypes(part)
  const resultType = part.resultType ?? 'aftermarket-upgrade'

  if (intent.primaryCategory && part.category === intent.primaryCategory) {
    score += 14
    explanation.push(`Primary category match: ${part.category}.`)
  } else if (intent.categories.includes(part.category)) {
    score += 6
    explanation.push(`Matches requested category: ${part.category}.`)
  }

  if (subtypeMatches.exactSubtypes.length > 0) {
    score += 52 * subtypeMatches.exactSubtypes.length
    explanation.push(`Direct subtype match for ${subtypeMatches.exactSubtypes[0].replace(/-/g, ' ')}.`)
  } else if (subtypeMatches.keywordSubtypes.length > 0) {
    score += 30 * subtypeMatches.keywordSubtypes.length
    explanation.push(`Strong subtype-keyword match for ${subtypeMatches.keywordSubtypes[0].replace(/-/g, ' ')}.`)
  } else if (intent.requestedSubtypes.length > 0 && requestedSubtypeCategories(intent).includes(part.category)) {
    score -= 32
    explanation.push('Same broad category, but not the requested specific subtype.')
  }

  const exactPhraseMatches = (part.exactMatchPhrases ?? []).filter((phrase) => intent.requestedPhrases.includes(normalize(phrase)) || normalize(intent.requestedPhrases.join(' ')).includes(normalize(phrase)))
  if (exactPhraseMatches.length > 0) {
    score += 24 * exactPhraseMatches.length
    explanation.push(`Exact phrase match for ${exactPhraseMatches[0]}.`)
  }

  if (intent.primaryIntentType && partIntentTypes.includes(intent.primaryIntentType)) {
    score += 18
    explanation.push(`Result type lines up with ${intent.primaryIntentType.replace(/-/g, ' ')} intent.`)
  } else if (intent.intentTypes.some((type) => partIntentTypes.includes(type))) {
    score += 8
    explanation.push('Matches a secondary intent lane from the structured classifier.')
  }

  if (intent.preferredResultTypes.includes(resultType)) {
    score += 10
    explanation.push(`Preferred result type match: ${resultType.replace(/-/g, ' ')}.`)
  }
  if (intent.suppressedResultTypes.includes(resultType)) {
    score -= 28
    explanation.push(`Suppressed because this looks like ${resultType.replace(/-/g, ' ')} for the inferred intent.`)
  }

  if (intent.requestedSubtypes.includes('steering-wheel') && (normalizedName.includes('cover') || normalizedName.includes('wrap') || subtypeMatches.allSubtypes.includes('steering-wheel-cover'))) {
    score -= 80
    explanation.push('Penalized because the query asks for a real steering wheel, not just a cover or wrap.')
  }
  if (intent.requestedSubtypes.includes('steering-wheel-trim') && !subtypeMatches.allSubtypes.includes('steering-wheel-trim')) {
    score -= 35
  }
  if (intent.requestedSubtypes.includes('headliner-suede') && !queryIncludesAny(`${normalizedName} ${normalizedSummary} ${(part.styleTags ?? []).join(' ')}`.toLowerCase(), ['suede', 'alcantara', 'microsuede'])) {
    score -= 80
    explanation.push('Penalized because the query specifically asks for suede/Alcantara-style headliner treatment.')
  }
  if (intent.primaryIntentType === 'replacement' && resultType === 'aftermarket-upgrade' && !(part.styleTags ?? []).includes('oem-like')) {
    score -= 20
  }
  if (intent.primaryIntentType === 'aftermarket-upgrade' && (resultType === 'oem-replacement' || resultType === 'parts-lookup')) {
    score -= 18
  }
  if (intent.primaryIntentType === 'cosmetic' && ['utility', 'maintenance'].includes(part.category)) {
    score -= 22
  }

  for (const trait of intent.desiredTraits) {
    if (partKeywords.has(trait) || normalizedSummary.includes(trait) || normalizedName.includes(trait)) score += 3
  }
  for (const trait of intent.preferredStyleTraits) {
    if ((part.styleTags ?? []).map(normalize).includes(normalize(trait)) || partKeywords.has(normalize(trait)) || normalizedSummary.includes(normalize(trait))) {
      score += 6
      explanation.push(`Style trait match: ${trait}.`)
    }
  }

  for (const keyword of intent.requestedKeywords) {
    if (partKeywords.has(keyword)) score += 2
    else if (normalizedName.includes(keyword) || normalizedSummary.includes(keyword)) score += 1
  }

  if (intent.wantsAggressiveSound && ['medium-high', 'high'].includes(String(part.attributes?.loudness ?? '').toLowerCase())) score += 4
  if (intent.needsQuiet && (partKeywords.has('oem+') || String(part.attributes?.quietFriendly ?? false) === 'true')) score += 3

  if (sourceExactness === 'exact-product') {
    score += 12
    if (intent.requiresExactProductBias) score += 10
    explanation.push('Has an exact product source in the local dataset.')
  } else if (sourceExactness === 'vehicle-page') {
    score += 5
    if (intent.requiresExactProductBias) score += 4
    explanation.push('Has a vehicle-specific source page in the local dataset.')
  } else if (sourceExactness === 'lookup') {
    if (intent.requiresExactProductBias) score -= 8
    explanation.push('Source is intentionally a lookup/search page because an exact live product page was not verified.')
  } else {
    score -= 4
    explanation.push('Source is still broad, so it ranks behind exact product or vehicle-page matches when available.')
  }

  if (typeof intent.maxBudget === 'number' && part.priceRange.max <= intent.maxBudget) score += 2
  if (part.attributes?.tuneRequired === true) explanation.push('Note: manufacturer data indicates a tune may be required.')

  return { score, explanation: Array.from(new Set(explanation)), subtypeMatches, sourceExactness, resultType }
}

export function findVehicleMatch(input: VehicleLookup): DemoVehicle | null {
  const wantedYear = Number(input.year)
  const wantedMake = normalize(input.make)
  const wantedModel = normalize(input.model)

  return (
    demoVehicles.find((vehicle) => {
      const sameYear = vehicle.year === wantedYear
      const sameMake = normalize(vehicle.make) === wantedMake
      const sameModel = normalize(vehicle.model) === wantedModel
      const trimOkay = !input.trim || normalize(vehicle.trim ?? '') === normalize(input.trim)
      const engineOkay = !input.engine || normalize(vehicle.engine ?? '') === normalize(input.engine)
      const drivetrainOkay = !input.drivetrain || normalize(vehicle.drivetrain ?? '') === normalize(input.drivetrain)
      return sameYear && sameMake && sameModel && trimOkay && engineOkay && drivetrainOkay
    }) ?? null
  )
}

export function searchGroundedParts(vehicleInput: VehicleLookup, query: string): SearchAiResponse {
  const vehicle = findVehicleMatch(vehicleInput)
  const intent = deriveIntentFromQuery(query)
  const warnings: string[] = []

  if (!vehicle) {
    return {
      vehicle: null,
      intent,
      results: [],
      warnings: ['Vehicle not found in the demo fitment database, so no recommendations were generated.'],
      constraints: ['This helper only answers from the local fitment dataset.', 'No vehicle match means no fitment-safe results.'],
      vehicleNotes: [],
    }
  }

  if (/turbo kit|supercharger|nitrous|widebody|lift kit/.test(normalize(query))) {
    warnings.push('Request includes items not covered by the demo dataset; unsupported items were ignored instead of guessed.')
  }
  if (intent.categories.length === 0) warnings.push('No known product category was detected, so results are ranked from all fitment-safe parts for this vehicle.')

  let matchingParts = demoParts
    .filter((part) => part.fitments.some((fitment) => fitment.vehicleId === vehicle.id))
    .filter((part) => partMatchesIntent(part, intent))
    .map((part) => {
      const scored = scorePart(part, intent)
      const fitmentNotes = part.fitments.filter((fitment) => fitment.vehicleId === vehicle.id).map((fitment) => fitment.notes).filter(Boolean) as string[]
      return {
        part,
        ...scored,
        fitmentNotes,
        source: {
          url: part.sourceUrl,
          label: part.sourceLabel ?? (part.sourceUrl ? 'Manufacturer / source link' : 'Local demo dataset only'),
          exactness: scored.sourceExactness,
        },
      }
    })

  if (intent.requestedSubtypes.length > 0) {
    const requestedCategories = new Set(requestedSubtypeCategories(intent))
    const exactSubtypeResults = matchingParts.filter((result) => result.subtypeMatches.exactSubtypes.length > 0)
    const keywordSubtypeResults = matchingParts.filter((result) => result.subtypeMatches.allSubtypes.length > 0)
    const strictPool = exactSubtypeResults.length > 0 ? exactSubtypeResults : keywordSubtypeResults

    if (strictPool.length > 0) {
      const coveredCategories = new Set(strictPool.map((result) => result.part.category).filter((category) => requestedCategories.has(category)))
      matchingParts = matchingParts.filter((result) => {
        if (!coveredCategories.has(result.part.category)) return true
        return result.subtypeMatches.allSubtypes.length > 0
      })
      warnings.push('Specific subtype matches were found, so broad same-category fallback results were suppressed.')
    }
  }

  if (intent.suppressedResultTypes.length > 0) {
    const preferredPool = matchingParts.filter((result) => !intent.suppressedResultTypes.includes(result.resultType))
    if (preferredPool.length > 0) {
      matchingParts = preferredPool
      warnings.push('Result-type suppression removed conceptually close but wrong-lane matches for this query.')
    }
  }

  matchingParts = matchingParts.sort((a, b) => b.score - a.score || a.part.priceRange.min - b.part.priceRange.min)

  if (matchingParts.length === 0) warnings.push('No fitment-safe parts matched the current structured filters.')

  return {
    vehicle,
    intent,
    results: matchingParts.map((result) => ({
      part: result.part,
      score: result.score,
      explanation: result.explanation.length ? result.explanation : ['Returned because it has an explicit fitment record for this vehicle in the local dataset.'],
      fitmentNotes: result.fitmentNotes,
      source: result.source,
    })),
    warnings,
    constraints: [
      'Query interpretation is rule-based and only maps to structured intent.',
      'Every result must exist in the local dataset.',
      'Every result must have an explicit fitment row for the matched vehicle.',
      'When explicit subtype matches exist in the DB, generic same-category fallback results are filtered out instead of merely ranked lower.',
      'Structured intent also suppresses wrong-lane result types (for example replacement vs upgrade vs accessory) when better matches exist.',
      'Source links are only exposed from the DB row; exactness is reported honestly rather than guessed.',
      'Unsupported requests are ignored or warned on instead of invented.',
    ],
    vehicleNotes: vehicle.platformNotes ?? [],
  }
}
