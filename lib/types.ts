export interface IntakeData {
  name: string
  email: string
  service: string
  year: string
  make: string
  model: string
  trim: string
  engine: string
  drivetrain: string
  mileage: string
  budget: string
  goals: string
  focus: string
  currentMods: string
  notes: string
}

export type PartCategory =
  | 'intake'
  | 'exhaust'
  | 'suspension'
  | 'brakes'
  | 'wheels-tires'
  | 'exterior'
  | 'interior'
  | 'lighting'
  | 'tune'
  | 'forced-induction'

export type PartTag =
  | 'performance'
  | 'style'
  | 'sound'
  | 'handling'
  | 'budget-friendly'
  | 'premium'
  | 'must-have'
  | 'weekend-install'

export type BudgetTier =
  | 'under-500'
  | '500-1000'
  | '1000-2500'
  | '2500-5000'
  | '5000-10000'
  | '10000+'

export type FocusType = 'performance' | 'style' | 'both'

export interface Retailer {
  name: string
  icon: string
  urlTemplate: string // uses {year} {make} {model} {query} placeholders
  priceNote?: string
}

export interface Part {
  id: string
  name: string
  brand: string
  category: PartCategory
  subcategory: string
  description: string
  longDescription: string
  priceRange: { min: number; max: number }
  difficulty: 'bolt-on' | 'moderate' | 'advanced' | 'professional'
  timeToInstall: string
  gainEstimate?: string
  tags: PartTag[]
  focus: FocusType[]
  budgetTiers: BudgetTier[]
  image: string
  retailers: Retailer[]
  youtubeQuery: string // uses {year} {make} {model} placeholders
  benefits: string[]
  installNotes?: string
  phase: number // 1 = do first, 2 = second, 3 = later
}
