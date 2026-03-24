import { Part, IntakeData, BudgetTier, FocusType } from './types'
import { partsDatabase } from './parts-database'

function mapBudgetToTier(budget: string): BudgetTier[] {
  switch (budget) {
    case 'Under $500':
      return ['under-500']
    case '$500–$1,000':
      return ['under-500', '500-1000']
    case '$1,000–$2,500':
      return ['under-500', '500-1000', '1000-2500']
    case '$2,500–$5,000':
      return ['500-1000', '1000-2500', '2500-5000']
    case '$5,000–$10,000':
      return ['1000-2500', '2500-5000', '5000-10000']
    case '$10,000+':
      return ['2500-5000', '5000-10000', '10000+']
    default:
      return ['under-500', '500-1000']
  }
}

function mapFocus(focus: string): FocusType[] {
  switch (focus) {
    case 'Performance':
      return ['performance', 'both']
    case 'Style':
      return ['style', 'both']
    case 'Both':
      return ['performance', 'style', 'both']
    default:
      return ['performance', 'style', 'both']
  }
}

function buildUrl(template: string, data: IntakeData): string {
  return template
    .replace(/{year}/g, encodeURIComponent(data.year))
    .replace(/{make}/g, encodeURIComponent(data.make))
    .replace(/{model}/g, encodeURIComponent(data.model))
}

function scorePart(part: Part, intake: IntakeData): number {
  let score = 0
  const goalsLower = intake.goals.toLowerCase()

  if (goalsLower.includes('sound') && part.tags.includes('sound')) score += 3
  if (goalsLower.includes('power') && part.tags.includes('performance')) score += 3
  if (goalsLower.includes('handling') && part.tags.includes('handling')) score += 3
  if (goalsLower.includes('look') && part.tags.includes('style')) score += 3
  if (goalsLower.includes('stance') && part.category === 'suspension') score += 2
  if (goalsLower.includes('wheel') && part.category === 'wheels-tires') score += 3
  if (goalsLower.includes('exhaust') && part.category === 'exhaust') score += 3
  if (goalsLower.includes('intake') && part.category === 'intake') score += 3
  if (goalsLower.includes('tint') && part.id === 'window-tint') score += 3
  if (goalsLower.includes('turbo') && part.category === 'forced-induction') score += 5
  if (goalsLower.includes('brake') && part.category === 'brakes') score += 3
  if (goalsLower.includes('seat') && part.category === 'interior') score += 3
  if (part.tags.includes('must-have')) score += 1
  if (part.tags.includes('budget-friendly') && intake.budget === 'Under $500') score += 2

  return score
}

export function getRecommendedParts(intake: IntakeData): Part[] {
  const allowedBudgets = mapBudgetToTier(intake.budget)
  const allowedFocus = mapFocus(intake.focus)

  const filtered = partsDatabase.filter((part) => {
    const budgetMatch = part.budgetTiers.some((t) => allowedBudgets.includes(t))
    const focusMatch = part.focus.some((f) => allowedFocus.includes(f))
    return budgetMatch && focusMatch
  })

  const scored = filtered.map((part) => ({ part, score: scorePart(part, intake) }))
  scored.sort((a, b) => b.score - a.score || a.part.phase - b.part.phase)
  return scored.map((s) => s.part).slice(0, 12)
}

export function getTopRatedParts(intake: IntakeData): { part: Part; score: number; stars: number }[] {
  const allowedBudgets = mapBudgetToTier(intake.budget)
  const allowedFocus = mapFocus(intake.focus)

  const filtered = partsDatabase.filter((part) => {
    const budgetMatch = part.budgetTiers.some((t) => allowedBudgets.includes(t))
    const focusMatch = part.focus.some((f) => allowedFocus.includes(f))
    return budgetMatch && focusMatch
  })

  const scored = filtered
    .map((part) => ({ part, score: scorePart(part, intake) }))
    .sort((a, b) => b.score - a.score || a.part.phase - b.part.phase)
    .slice(0, 10)

  const maxScore = scored[0]?.score || 1

  return scored.map(({ part, score }) => ({
    part,
    score,
    // Normalize to 1–5 stars, minimum 3 since all passed the filter
    stars: Math.max(3, Math.round((score / Math.max(maxScore, 1)) * 5)),
  }))
}

export function buildRetailerUrl(urlTemplate: string, intake: IntakeData): string {
  return buildUrl(urlTemplate, intake)
}

export function buildYoutubeUrl(query: string, intake: IntakeData): string {
  const resolved = buildUrl(query, intake)
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(resolved)}`
}

export function estimateTotalCost(parts: Part[]): { min: number; max: number } {
  return parts.reduce(
    (acc, part) => ({
      min: acc.min + part.priceRange.min,
      max: acc.max + part.priceRange.max,
    }),
    { min: 0, max: 0 }
  )
}
