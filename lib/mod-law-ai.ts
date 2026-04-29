import { MOD_LAWS, type StateLaws } from './mod-laws'

export type LawIntent = 
  | 'tint_question'
  | 'exhaust_question' 
  | 'emissions_question'
  | 'underglow_question'
  | 'straight_pipe_question'
  | 'headlight_question'
  | 'comparison'
  | 'strictness_ranking'
  | 'general_info'
  | 'unknown'

export type ParsedLawQuery = {
  intent: LawIntent
  states: string[]
  topics: string[]
  comparisonType?: 'most_lenient' | 'most_strict' | 'comparison'
  originalQuery: string
}

export type LawAnswer = {
  answer: string
  sources: { state: string; law: StateLaws; relevantField: string }[]
  relatedQuestions: string[]
  confidence: 'high' | 'medium' | 'low'
}

const STATE_ABBREVS: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY', 'dc': 'DC', 'washington dc': 'DC'
}

const STATE_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_ABBREVS).map(([k, v]) => [v, k.charAt(0).toUpperCase() + k.slice(1)])
)

export function parseLawQuery(query: string): ParsedLawQuery {
  const lower = query.toLowerCase()
  
  // Extract states mentioned
  const states: string[] = []
  for (const [name, abbr] of Object.entries(STATE_ABBREVS)) {
    if (lower.includes(name) || lower.includes(abbr.toLowerCase())) {
      if (!states.includes(abbr)) states.push(abbr)
    }
  }
  
  // Detect intent
  let intent: LawIntent = 'unknown'
  const topics: string[] = []
  
  // Window tint
  if (lower.includes('tint') || lower.includes('window') || lower.includes('tinted')) {
    intent = 'tint_question'
    topics.push('tint')
  }
  
  // Exhaust / straight pipe
  if (lower.includes('exhaust') || lower.includes('muffler') || lower.includes('loud') || lower.includes('db') || lower.includes('decibel')) {
    intent = 'exhaust_question'
    topics.push('exhaust')
  }
  if (lower.includes('straight pipe') || lower.includes('straightpipe') || lower.includes('catless')) {
    intent = 'straight_pipe_question'
    topics.push('straightPipe')
  }
  
  // Emissions
  if (lower.includes('emissions') || lower.includes('smog') || lower.includes('inspection') || lower.includes('e-check')) {
    intent = 'emissions_question'
    topics.push('emissions')
  }
  
  // Underglow
  if (lower.includes('underglow') || lower.includes('neon') || lower.includes('led under') || lower.includes('ground effect')) {
    intent = 'underglow_question'
    topics.push('underglow')
  }
  
  // Headlights
  if (lower.includes('headlight') || lower.includes('light color') || lower.includes('colored light') || lower.includes('hid') || lower.includes('led head')) {
    intent = 'headlight_question'
    topics.push('coloredHeadlights')
  }
  
  // Comparisons
  if (lower.includes('most lenient') || lower.includes('least strict') || lower.includes('best state') || lower.includes('easiest')) {
    intent = 'strictness_ranking'
    topics.push('strictness')
    if (!states.length) {
      // Return all states for ranking
      states.push(...Object.values(STATE_ABBREVS))
    }
  }
  
  if (lower.includes('compare') || lower.includes('difference between') || lower.includes('vs') || lower.includes('versus')) {
    intent = 'comparison'
    if (states.length >= 2) {
      topics.push('comparison')
    }
  }
  
  // General if no specific intent but has states
  if (intent === 'unknown' && states.length > 0) {
    intent = 'general_info'
  }
  
  return {
    intent,
    states,
    topics,
    originalQuery: query
  }
}

export function answerLawQuery(parsed: ParsedLawQuery): LawAnswer {
  const { intent, states, topics, originalQuery } = parsed
  
  // If no states mentioned and it's not a ranking, ask for clarification
  if (states.length === 0 && intent !== 'strictness_ranking') {
    return {
      answer: "I need to know which state you're asking about. Try asking 'Is underglow legal in Texas?' or 'What are the tint laws in California?'",
      sources: [],
      relatedQuestions: [
        "Is window tint legal in [state]?",
        "Can I have a straight pipe in [state]?",
        "Do I need emissions testing in [state]?",
        "Which states are most lenient for car mods?"
      ],
      confidence: 'low'
    }
  }
  
  const sources: LawAnswer['sources'] = []
  let answer = ''
  
  // Handle strictness ranking
  if (intent === 'strictness_ranking') {
    const allLaws = Object.values(MOD_LAWS)
    const lenient = allLaws.filter(l => l.strictness === 'lenient').map(l => l.state)
    const strict = allLaws.filter(l => l.strictness === 'strict').map(l => l.state)
    const moderate = allLaws.filter(l => l.strictness === 'moderate').map(l => l.state)
    
    answer = `**Most Lenient States** (best for car mods):\n${lenient.slice(0, 5).join(', ')}${lenient.length > 5 ? ` and ${lenient.length - 5} more` : ''}\n\n`
    answer += `**Most Strict States** (hardest to mod):\n${strict.slice(0, 5).join(', ')}${strict.length > 5 ? ` and ${strict.length - 5} more` : ''}\n\n`
    answer += `**Moderate States**:\n${moderate.slice(0, 5).join(', ')}${moderate.length > 5 ? ` and ${moderate.length - 5} more` : ''}`
    
    return {
      answer,
      sources: [],
      relatedQuestions: [
        "What makes California so strict?",
        "Which states don't require emissions testing?",
        "Where can I have the darkest window tint?"
      ],
      confidence: 'high'
    }
  }
  
  // Handle comparisons
  if (intent === 'comparison' && states.length >= 2) {
    const stateLaws = states.map(s => MOD_LAWS[s]).filter(Boolean)
    if (stateLaws.length < 2) {
      return {
        answer: `I don't have data for ${states.filter(s => !MOD_LAWS[s]).join(', ')} yet.` ,
        sources: [],
        relatedQuestions: [],
        confidence: 'low'
      }
    }
    
    answer = `**${stateLaws.map(l => l.state).join(' vs ')}**\n\n`
    
    // Compare strictness
    answer += `**Strictness:**\n`
    stateLaws.forEach(law => {
      answer += `• ${law.state}: ${law.strictness}\n`
    })
    answer += `\n`
    
    // Compare emissions
    answer += `**Emissions Testing:**\n`
    stateLaws.forEach(law => {
      answer += `• ${law.state}: ${law.emissions.required ? 'Required' : 'Not required'}${law.emissions.areas ? ` in ${law.emissions.areas}` : ''}\n`
    })
    
    stateLaws.forEach(law => {
      sources.push({ state: law.abbr, law, relevantField: 'comparison' })
    })
    
    return {
      answer,
      sources,
      relatedQuestions: topics.map(t => `Tell me more about ${t} laws`),
      confidence: 'high'
    }
  }
  
  // Handle specific questions
  const stateLaw = states[0] ? MOD_LAWS[states[0]] : null
  if (!stateLaw) {
    return {
      answer: `I don't have law data for ${states[0]} yet.`,
      sources: [],
      relatedQuestions: [
        "Which states can I have underglow in?",
        "Where are straight pipes legal?",
        "What states don't require emissions testing?"
      ],
      confidence: 'low'
    }
  }
  
  sources.push({ state: stateLaw.abbr, law: stateLaw, relevantField: intent })
  
  switch (intent) {
    case 'tint_question':
      answer = `**${stateLaw.state} Window Tint Laws**\n\n`
      answer += `• **Front side windows:** ${stateLaw.tint.frontSide}\n`
      answer += `• **Rear side windows:** ${stateLaw.tint.rearSide}\n`
      answer += `• **Rear window:** ${stateLaw.tint.rear}\n`
      if (stateLaw.tint.note) {
        answer += `\n**Note:** ${stateLaw.tint.note}`
      }
      break
      
    case 'exhaust_question':
      answer = `**${stateLaw.state} Exhaust Laws**\n\n`
      answer += `• **Noise limit:** ${stateLaw.exhaust.limit}\n`
      if (stateLaw.exhaust.note) {
        answer += `\n**Note:** ${stateLaw.exhaust.note}`
      }
      break
      
    case 'straight_pipe_question':
      answer = `**${stateLaw.state} Straight Pipe Laws**\n\n`
      answer += `• **Status:** ${stateLaw.straightPipe.status === 'legal' ? '✓ Legal' : stateLaw.straightPipe.status === 'restricted' ? '~ Restricted' : '✕ Illegal'}\n`
      answer += `\n${stateLaw.straightPipe.note}`
      break
      
    case 'emissions_question':
      answer = `**${stateLaw.state} Emissions Testing**\n\n`
      answer += `• **Required:** ${stateLaw.emissions.required ? 'Yes' : 'No'}\n`
      if (stateLaw.emissions.areas) {
        answer += `• **Areas:** ${stateLaw.emissions.areas}\n`
      }
      if (stateLaw.emissions.note) {
        answer += `\n**Note:** ${stateLaw.emissions.note}`
      }
      break
      
    case 'underglow_question':
      answer = `**${stateLaw.state} Underglow/Neon Laws**\n\n`
      answer += `• **Status:** ${stateLaw.underglow.status === 'legal' ? '✓ Legal' : stateLaw.underglow.status === 'restricted' ? '~ Restricted' : '✕ Illegal'}\n`
      answer += `\n${stateLaw.underglow.note}`
      break
      
    case 'headlight_question':
      answer = `**${stateLaw.state} Headlight/Colored Light Laws**\n\n`
      answer += `• **Status:** ${stateLaw.coloredHeadlights.status === 'legal' ? '✓ Legal' : stateLaw.coloredHeadlights.status === 'restricted' ? '~ Restricted' : '✕ Illegal'}\n`
      answer += `\n${stateLaw.coloredHeadlights.note}`
      break
      
    case 'general_info':
      answer = `**${stateLaw.state} Modification Laws Overview**\n\n`
      answer += `**Strictness Level:** ${stateLaw.strictness}\n\n`
      answer += `• **Window Tint:** Front ${stateLaw.tint.frontSide}, Rear ${stateLaw.tint.rearSide}\n`
      answer += `• **Emissions:** ${stateLaw.emissions.required ? 'Required' : 'Not required'}\n`
      answer += `• **Straight Pipes:** ${stateLaw.straightPipe.status}\n`
      answer += `• **Underglow:** ${stateLaw.underglow.status}\n`
      answer += `• **Exhaust:** ${stateLaw.exhaust.limit}`
      break
      
    default:
      answer = `I can tell you about window tint, exhaust, emissions, underglow, and straight pipe laws in ${stateLaw.state}. What specifically would you like to know?`
  }
  
  return {
    answer,
    sources,
    relatedQuestions: [
      `What about ${topics[0]} laws in other states?`,
      `Is straight pipe legal in ${stateLaw.state}?`,
      `Tell me about emissions testing in ${stateLaw.state}`,
      `How strict is ${stateLaw.state} compared to California?`
    ],
    confidence: 'high'
  }
}

export function searchAllStatesFor(topic: keyof StateLaws['underglow'] | keyof StateLaws['straightPipe'] | keyof StateLaws['emissions'], value?: any): { state: string; result: any }[] {
  const results: { state: string; result: any }[] = []
  
  for (const [abbr, laws] of Object.entries(MOD_LAWS)) {
    if (topic === 'status' && 'underglow' in laws) {
      results.push({ state: laws.state, result: laws.underglow.status })
    } else if (topic === 'required' && 'emissions' in laws) {
      results.push({ state: laws.state, result: laws.emissions.required })
    }
  }
  
  return value !== undefined 
    ? results.filter(r => r.result === value)
    : results
}
