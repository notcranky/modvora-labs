import { supabase } from './supabase'

// ── Types ────────────────────────────────────────────────────────────────────

export interface Nomination {
  id: string
  week_id: string
  post_id: string
  post_slug: string
  post_title: string
  post_hero_image: string
  vehicle_label: string
  submitter_user_id: string
  created_at: string
}

export type VotingPhase = 'nominations' | 'final' | 'results'

// ── Week / Phase helpers ─────────────────────────────────────────────────────

export function getCurrentWeekId(): string {
  const now = new Date()
  // Find Monday of current week
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  const year = monday.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const weekNum = Math.ceil(
    ((monday.getTime() - startOfYear.getTime()) / 86400000 + ((startOfYear.getDay() + 6) % 7) + 1) / 7
  )
  return `${year}-W${String(weekNum).padStart(2, '0')}`
}

export function getVotingPhase(): VotingPhase {
  const day = new Date().getDay() // 0=Sun, 6=Sat, 1-5=Mon-Fri
  if (day === 6) return 'final'
  if (day === 0) return 'results'
  return 'nominations'
}

export function getPhaseLabel(phase: VotingPhase): string {
  switch (phase) {
    case 'nominations': return 'Voting Open'
    case 'final':       return '🔥 Final Round'
    case 'results':     return '👑 Winner'
  }
}

export function getPhaseDescription(phase: VotingPhase): string {
  switch (phase) {
    case 'nominations': return 'Vote for your favourite build. Top 3 advance to the final on Saturday.'
    case 'final':       return "It's the final round! Top 3 builds are competing. One vote — make it count."
    case 'results':     return "This week's winner has been crowned. Nominations reopen Monday."
  }
}

export function getTimeUntilNextPhase(): string {
  const now = new Date()
  const day = now.getDay()
  const hoursLeft = 23 - now.getHours()
  const minsLeft = 59 - now.getMinutes()

  let daysLeft = 0
  if (day === 0) daysLeft = 1        // Sunday → Monday
  else if (day >= 1 && day <= 5) daysLeft = 6 - day  // Mon-Fri → Saturday
  // Saturday: show hours left

  if (daysLeft === 0) return `${hoursLeft}h ${minsLeft}m left`
  if (daysLeft === 1) return `Tomorrow`
  return `${daysLeft} days left`
}

// ── DB queries ───────────────────────────────────────────────────────────────

export async function getNominations(weekId: string): Promise<Nomination[]> {
  const { data, error } = await supabase
    .from('nominations')
    .select('*')
    .eq('week_id', weekId)
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return data as Nomination[]
}

export async function getVoteCounts(
  weekId: string,
  round: number = 1
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('nomination_votes')
    .select('nomination_id')
    .eq('week_id', weekId)
    .eq('round', round)
  if (error || !data) return {}
  const counts: Record<string, number> = {}
  for (const row of data) {
    counts[row.nomination_id] = (counts[row.nomination_id] ?? 0) + 1
  }
  return counts
}

export async function getUserVote(
  weekId: string,
  userId: string,
  round: number = 1
): Promise<string | null> {
  const { data } = await supabase
    .from('nomination_votes')
    .select('nomination_id')
    .eq('week_id', weekId)
    .eq('user_id', userId)
    .eq('round', round)
    .maybeSingle()
  return data?.nomination_id ?? null
}

export async function castVote(
  weekId: string,
  nominationId: string,
  userId: string,
  round: number = 1
): Promise<{ ok: boolean; error?: string }> {
  // Remove existing vote for this round first (allows changing vote)
  await supabase
    .from('nomination_votes')
    .delete()
    .eq('week_id', weekId)
    .eq('user_id', userId)
    .eq('round', round)

  const { error } = await supabase
    .from('nomination_votes')
    .insert({ week_id: weekId, nomination_id: nominationId, user_id: userId, round })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function submitNomination(params: {
  weekId: string
  postId: string
  postSlug: string
  postTitle: string
  postHeroImage: string
  vehicleLabel: string
  submitterUserId: string
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('nominations').insert({
    week_id: params.weekId,
    post_id: params.postId,
    post_slug: params.postSlug,
    post_title: params.postTitle,
    post_hero_image: params.postHeroImage,
    vehicle_label: params.vehicleLabel,
    submitter_user_id: params.submitterUserId,
  })
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'This build is already nominated this week.' }
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export function subscribeToVotes(weekId: string, callback: () => void) {
  return supabase
    .channel(`votes:${weekId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'nomination_votes', filter: `week_id=eq.${weekId}` },
      callback
    )
    .subscribe()
}

export function subscribeToNominations(weekId: string, callback: () => void) {
  return supabase
    .channel(`nominations:${weekId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'nominations', filter: `week_id=eq.${weekId}` },
      callback
    )
    .subscribe()
}
