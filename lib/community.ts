import { SavedVehicle, getVehicleLabel, loadCheckedParts, loadVehicles } from './garage'
import { supabase } from './supabase'

export const COMMUNITY_POSTS_KEY = 'modvora_community_posts'
const DELETED_POSTS_KEY = 'modvora_deleted_posts'

function getDeletedPostIds(): Set<string> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(DELETED_POSTS_KEY) : null
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function markPostDeleted(postId: string) {
  try {
    const ids = getDeletedPostIds()
    ids.add(postId)
    localStorage.setItem(DELETED_POSTS_KEY, JSON.stringify(Array.from(ids)))
  } catch {}
}

export type CommunityBuildStatus = 'in-progress' | 'completed'
export type CommunityPublishState = 'draft' | 'published'

export interface CommunityPostLink {
  label: string
  url: string
}

export type CommunityHeroOrientation = 'landscape' | 'portrait'

export interface CommunityHeroFrame {
  x: number
  y: number
  zoom: number
  orientation?: CommunityHeroOrientation
}

export interface CommunityPost {
  id: string
  slug: string
  vehicleId: string
  title: string
  description: string
  tags: string[]
  vibe: string
  status: CommunityBuildStatus
  state: CommunityPublishState
  heroImage: string
  gallery: string[]
  heroFrame?: CommunityHeroFrame
  links: CommunityPostLink[]
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export interface CommunityPostWithVehicle extends CommunityPost {
  vehicle: SavedVehicle
  progressPercent: number
  checkedPartsCount: number
  vehicleLabel: string
  isLocal: boolean
}

export interface PublishCommunityInput {
  postId?: string
  slug?: string
  vehicleId: string
  title: string
  description: string
  tags: string[]
  vibe: string
  status: CommunityBuildStatus
  state: CommunityPublishState
  heroImage: string
  gallery: string[]
  heroFrame?: CommunityHeroFrame
  links: CommunityPostLink[]
}

const sampleVehicles: SavedVehicle[] = [
  {
    id: 'sample-wrx',
    name: 'Tyler',
    email: 'tyler@example.com',
    service: 'free-tier',
    year: '2018',
    make: 'Subaru',
    model: 'WRX',
    trim: 'STI',
    engine: 'EJ257 2.5T',
    drivetrain: 'AWD',
    mileage: '41200',
    budget: '$5k-$10k',
    goals: 'Stage 2 power, proper suspension, keep it streetable.',
    focus: 'performance',
    transmission: 'manual',
    currentMods: 'COBB AccessPort, catback, Group N bushings',
    notes: 'Daily driver on weekdays, canyon run on weekends',
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'sample-mustang',
    name: 'Marcus',
    email: 'marcus@example.com',
    service: 'free-tier',
    year: '2019',
    make: 'Ford',
    model: 'Mustang GT',
    trim: 'GT Premium',
    engine: '5.0 Coyote V8',
    drivetrain: 'RWD',
    mileage: '28900',
    budget: '$3k-$5k',
    goals: 'Loud, fast, and mean looking. Keeping it naturally aspirated for now.',
    focus: 'performance',
    transmission: 'manual',
    currentMods: 'Roush axleback, cold air intake, tune',
    notes: 'Weekend car only',
    createdAt: '2026-02-05T10:00:00.000Z',
    updatedAt: '2026-03-28T10:00:00.000Z',
  },
  {
    id: 'sample-civic',
    name: 'Jamie',
    email: 'jamie@example.com',
    service: 'free-tier',
    year: '2017',
    make: 'Honda',
    model: 'Civic',
    trim: 'Si',
    engine: '1.5T K',
    drivetrain: 'FWD',
    mileage: '67000',
    budget: '$2k-$4k',
    goals: 'Full JDM-inspired build on a budget. Every dollar tracked.',
    focus: 'both',
    transmission: 'manual',
    currentMods: 'Coilovers, wheels, short shifter, intake',
    notes: 'Still daily driving it',
    createdAt: '2025-11-20T10:00:00.000Z',
    updatedAt: '2026-04-05T10:00:00.000Z',
  },
  {
    id: 'sample-4runner',
    name: 'Derek',
    email: 'derek@example.com',
    service: 'free-tier',
    year: '2021',
    make: 'Toyota',
    model: '4Runner',
    trim: 'TRD Off-Road',
    engine: '4.0L V6',
    drivetrain: '4WD',
    mileage: '19800',
    budget: '$5k-$10k',
    goals: 'Overland ready — lift, lights, skids, recovery gear.',
    focus: 'both',
    transmission: 'automatic',
    currentMods: '3in lift, All-Terrain tires, ARB bumper',
    notes: 'Family hauler that can go anywhere',
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-03-20T10:00:00.000Z',
  },
  {
    id: 'sample-350z',
    name: 'Chris',
    email: 'chris@example.com',
    service: 'free-tier',
    year: '2006',
    make: 'Nissan',
    model: '350Z',
    trim: 'Enthusiast',
    engine: 'VQ35DE',
    drivetrain: 'RWD',
    mileage: '89400',
    budget: '$2k-$5k',
    goals: 'Restore, refresh, then modify. Get it back to 100% before adding power.',
    focus: 'both',
    transmission: 'manual',
    currentMods: 'Coilovers, new clutch, wheels, HID retrofit',
    notes: 'High mileage but solid chassis',
    createdAt: '2025-10-01T10:00:00.000Z',
    updatedAt: '2026-02-14T10:00:00.000Z',
  },
  {
    id: 'sample-gr86',
    name: 'Alex',
    email: 'alex@example.com',
    service: 'free-tier',
    year: '2023',
    make: 'Toyota',
    model: 'GR86',
    trim: 'Premium',
    engine: '2.4L Boxer',
    drivetrain: 'RWD',
    mileage: '12400',
    budget: '$5k-$10k',
    goals: 'OEM+ street build with better stance, sharper handling, and a more aggressive but still clean look.',
    focus: 'both',
    transmission: '',
    currentMods: 'Coilovers, cat-back exhaust, tint',
    notes: 'Daily-driven canyon car',
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-18T10:00:00.000Z',
  },
  {
    id: 'sample-m2',
    name: 'Jordan',
    email: 'jordan@example.com',
    service: 'premium',
    year: '2020',
    make: 'BMW',
    model: 'M2 Competition',
    trim: '',
    engine: 'S55',
    drivetrain: 'RWD',
    mileage: '23100',
    budget: '$10k+',
    goals: 'Fast road / weekend build with confidence on mountain roads and a sharper visual presence.',
    focus: 'performance',
    transmission: '',
    currentMods: 'Intake, wheels, brake pads',
    notes: 'Weekend-focused',
    createdAt: '2026-02-20T10:00:00.000Z',
    updatedAt: '2026-03-10T10:00:00.000Z',
  },
]

const samplePosts: CommunityPost[] = [
  {
    id: 'post-wrx-stage2',
    slug: 'stage2-wrx-sti-build',
    vehicleId: 'sample-wrx',
    title: 'Stage 2 STI Street Build',
    description: 'Slowly turning this into a proper stage 2. COBB tune is dialed in, next up is the intake and intercooler. Every mod logged, every receipt saved.',
    tags: ['subaru', 'wrx', 'stage2', 'jdm', 'awd'],
    vibe: 'understated sleeper',
    status: 'in-progress',
    state: 'published',
    heroImage: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
    ],
    heroFrame: { x: 50, y: 50, zoom: 1.05 },
    links: [],
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-04-01T10:00:00.000Z',
    publishedAt: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'post-mustang-gt',
    slug: 'coyote-mustang-gt-build',
    vehicleId: 'sample-mustang',
    title: 'Coyote GT — Keeping It NA',
    description: "Not going forced induction. Just wringing out everything the 5.0 has naturally. Roush axleback sounds insane, tune picked up 28whp. Next is headers.",
    tags: ['mustang', 'ford', 'v8', 'na', 'street'],
    vibe: 'raw american muscle',
    status: 'in-progress',
    state: 'published',
    heroImage: 'https://images.unsplash.com/photo-1547245324-d777c6f05e80?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1547245324-d777c6f05e80?auto=format&fit=crop&w=1600&q=80',
    ],
    heroFrame: { x: 50, y: 50, zoom: 1.0 },
    links: [],
    createdAt: '2026-02-05T10:00:00.000Z',
    updatedAt: '2026-03-28T10:00:00.000Z',
    publishedAt: '2026-03-28T10:00:00.000Z',
  },
  {
    id: 'post-civic-si-budget',
    slug: 'civic-si-jdm-budget-build',
    vehicleId: 'sample-civic',
    title: 'Civic Si — JDM Budget Build',
    description: "Proving you don't need a big budget to build something clean. Coilovers, a set of Enkeis, and a short shifter. Feels completely different to drive.",
    tags: ['honda', 'civic', 'jdm', 'budget', 'fwd'],
    vibe: 'clean budget jdm',
    status: 'in-progress',
    state: 'published',
    heroImage: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1600&q=80',
    ],
    heroFrame: { x: 50, y: 50, zoom: 1.0 },
    links: [],
    createdAt: '2025-11-20T10:00:00.000Z',
    updatedAt: '2026-04-05T10:00:00.000Z',
    publishedAt: '2026-04-05T10:00:00.000Z',
  },
  {
    id: 'post-4runner-overland',
    slug: '4runner-overland-build',
    vehicleId: 'sample-4runner',
    title: '4Runner TRD Overland Build',
    description: 'Built to go anywhere with the family. 3 inch lift, ARB front bumper, recovery gear under the floor. Just got back from a 4-day trail run in Colorado.',
    tags: ['toyota', '4runner', 'overland', 'offroad', 'lifted'],
    vibe: 'capable overland rig',
    status: 'in-progress',
    state: 'published',
    heroImage: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1600&q=80',
    ],
    heroFrame: { x: 50, y: 50, zoom: 1.0 },
    links: [],
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-03-20T10:00:00.000Z',
    publishedAt: '2026-03-20T10:00:00.000Z',
  },
  {
    id: 'post-350z-revival',
    slug: '350z-revival-build',
    vehicleId: 'sample-350z',
    title: '350Z Revival — 89k Miles, Full Refresh',
    description: 'Bought it rough, driving it every day. New clutch, coilovers, a full detail, and a set of Work wheels. High mileage Z but it rips. More power coming soon.',
    tags: ['nissan', '350z', 'jdm', 'revival', 'rwd'],
    vibe: 'high mileage restomod',
    status: 'in-progress',
    state: 'published',
    heroImage: 'https://images.unsplash.com/photo-1590510696235-4e8e2e9cdd9c?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1590510696235-4e8e2e9cdd9c?auto=format&fit=crop&w=1600&q=80',
    ],
    heroFrame: { x: 50, y: 50, zoom: 1.0 },
    links: [],
    createdAt: '2025-10-01T10:00:00.000Z',
    updatedAt: '2026-02-14T10:00:00.000Z',
    publishedAt: '2026-02-14T10:00:00.000Z',
  },
  {
    id: 'post-gr86-midnight',
    slug: 'midnight-club-gr86',
    vehicleId: 'sample-gr86',
    title: 'Midnight Club GR86',
    description: 'A clean street-oriented GR86 build with just enough aggression: lower stance, deeper wheels, and OEM+ details that still look factory intentional.',
    tags: ['oem+', 'street build', 'stance', 'daily'],
    vibe: 'clean night-run coupe',
    status: 'in-progress',
    state: 'published',
    heroImage: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=1600&q=80',
    ],
    heroFrame: { x: 50, y: 46, zoom: 1.08 },
    links: [{ label: 'Instagram inspiration', url: 'https://www.instagram.com/' }],
    createdAt: '2026-03-11T09:00:00.000Z',
    updatedAt: '2026-03-18T13:00:00.000Z',
    publishedAt: '2026-03-18T13:00:00.000Z',
  },
  {
    id: 'post-m2-voltage',
    slug: 'voltage-m2-competition',
    vehicleId: 'sample-m2',
    title: 'Voltage M2 Competition',
    description: 'Compact, muscular, and focused on response. This M2 leans into grip, braking, and an understated visual setup that still feels premium.',
    tags: ['track-ready', 'grip', 'premium', 'driver car'],
    vibe: 'compact brute with clean details',
    status: 'completed',
    state: 'published',
    heroImage: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1502161254066-6c74afbf07aa?auto=format&fit=crop&w=1600&q=80',
    ],
    heroFrame: { x: 50, y: 40, zoom: 1.06 },
    links: [{ label: 'Build notes', url: 'https://www.youtube.com/' }],
    createdAt: '2026-03-02T11:00:00.000Z',
    updatedAt: '2026-03-15T14:20:00.000Z',
    publishedAt: '2026-03-15T14:20:00.000Z',
  },
]

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
}

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function getSampleCommunityPosts() {
  return samplePosts
}

export function getSampleCommunityVehicles() {
  return sampleVehicles
}

function normalizeStoredCommunityPost(post: CommunityPost): CommunityPost {
  const heroImage = post.heroImage
  const gallery = Array.from(new Set([
    heroImage,
    ...(post.gallery ?? []).filter((image) => image && image !== heroImage),
  ].filter(Boolean))).slice(0, 12)

  return {
    ...post,
    heroImage,
    gallery: gallery.length ? gallery : heroImage ? [heroImage] : [],
  }
}

function compactCommunityPostForStorage(post: CommunityPost): CommunityPost {
  return {
    ...post,
    gallery: (post.gallery ?? []).filter((image) => image && image !== post.heroImage),
  }
}

export function loadCommunityPosts(): CommunityPost[] {
  return safeRead<CommunityPost[]>(COMMUNITY_POSTS_KEY, []).map(normalizeStoredCommunityPost)
}

export function saveCommunityPosts(posts: CommunityPost[]) {
  localStorage.setItem(COMMUNITY_POSTS_KEY, JSON.stringify(posts.map(compactCommunityPostForStorage)))
}

export function getEditableCommunityPost(slug: string) {
  return loadCommunityPosts().find((post) => post.slug === slug) ?? null
}

export function buildCommunityFeed(): CommunityPostWithVehicle[] {
  const vehicles = [...loadVehicles(), ...getSampleCommunityVehicles()]
  const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]))
  const localPosts = loadCommunityPosts()
  const localPostIds = new Set(localPosts.map((post) => post.id))
  const posts = [...getSampleCommunityPosts(), ...localPosts]

  return posts
    .filter((post) => post.state === 'published')
    .map((post) => {
      const vehicle = vehicleMap.get(post.vehicleId)
      if (!vehicle) return null
      const checkedPartsCount = vehicle.id.startsWith('sample-') ? (post.status === 'completed' ? 10 : 6) : loadCheckedParts(vehicle.id).length
      const progressPercent = vehicle.id.startsWith('sample-')
        ? (post.status === 'completed' ? 100 : 64)
        : Math.min(100, Math.max(post.status === 'completed' ? 100 : 12, checkedPartsCount * 12))

      return {
        ...post,
        vehicle,
        checkedPartsCount,
        progressPercent,
        vehicleLabel: getVehicleLabel(vehicle),
        isLocal: localPostIds.has(post.id),
      }
    })
    .filter((post): post is CommunityPostWithVehicle => Boolean(post))
    .sort((a, b) => new Date(b.publishedAt ?? b.updatedAt).getTime() - new Date(a.publishedAt ?? a.updatedAt).getTime())
}

export function getCommunityPostBySlug(slug: string) {
  return buildCommunityFeed().find((post) => post.slug === slug) ?? null
}

export function getCommunityDraftsForVehicle(vehicleId: string) {
  return loadCommunityPosts().filter((post) => post.vehicleId === vehicleId)
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

function getSampleCommunityFeed(): CommunityPostWithVehicle[] {
  const vehicleMap = new Map(sampleVehicles.map((v) => [v.id, v]))
  return samplePosts
    .filter((p) => p.state === 'published')
    .map((post) => {
      const vehicle = vehicleMap.get(post.vehicleId)
      if (!vehicle) return null
      return {
        ...post,
        vehicle,
        vehicleLabel: getVehicleLabel(vehicle),
        progressPercent: post.status === 'completed' ? 100 : 64,
        checkedPartsCount: post.status === 'completed' ? 10 : 6,
        isLocal: false,
      }
    })
    .filter((p): p is CommunityPostWithVehicle => Boolean(p))
}

export async function fetchPublishedBuilds(): Promise<CommunityPostWithVehicle[]> {
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .eq('state', 'published')
      .order('published_at', { ascending: false })

    const samples = getSampleCommunityFeed()
    if (error || !data) {
      const localFeed = buildCommunityFeed().filter((p) => !new Set(samples.map((s) => s.id)).has(p.id))
      return [...samples, ...localFeed].filter((p) => !getDeletedPostIds().has(p.id))
    }

    const remote: CommunityPostWithVehicle[] = data.map((row) => {
      const vehicle = row.vehicle_data as SavedVehicle
      return {
        id: row.id,
        slug: row.slug,
        vehicleId: vehicle?.id ?? '',
        title: row.title,
        description: row.description ?? '',
        tags: row.tags ?? [],
        vibe: row.vibe ?? '',
        status: row.status as CommunityBuildStatus,
        state: row.state as CommunityPublishState,
        heroImage: row.hero_image ?? '',
        gallery: row.gallery ?? [],
        heroFrame: row.hero_frame ?? undefined,
        links: row.links ?? [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        publishedAt: row.published_at,
        vehicle,
        vehicleLabel: vehicle ? getVehicleLabel(vehicle) : '',
        progressPercent: row.progress_percent ?? 0,
        checkedPartsCount: 0,
        isLocal: false,
      }
    })

    const sampleIds = new Set(samples.map((s) => s.id))
    const remoteIds = new Set(remote.map((r) => r.id))
    const deletedIds = getDeletedPostIds()

    // Include localStorage posts not already synced to Supabase (so new posts appear immediately)
    const localFeed = buildCommunityFeed().filter(
      (p) => !sampleIds.has(p.id) && !remoteIds.has(p.id),
    )

    const all = [...samples, ...remote.filter((r) => !sampleIds.has(r.id)), ...localFeed]
    return all
      .filter((p) => !deletedIds.has(p.id))
      .sort((a, b) => new Date(b.publishedAt ?? b.updatedAt).getTime() - new Date(a.publishedAt ?? a.updatedAt).getTime())
  } catch {
    return getSampleCommunityFeed()
  }
}

export async function publishToSupabase(
  input: PublishCommunityInput,
  vehicle: SavedVehicle,
  progressPercent: number,
  resolvedId: string,
  resolvedSlug: string,
): Promise<void> {
  const now = new Date().toISOString()
  try {
    const heroImage = input.heroImage
    const gallery = input.gallery.filter((img) => img !== heroImage)

    // Look up existing post by slug first — handles the case where localStorage was
    // cleared and a new local ID was generated that doesn't match what's in Supabase.
    const { data: existingBySlug } = await supabase
      .from('community_posts')
      .select('id, created_at, published_at')
      .eq('slug', resolvedSlug)
      .maybeSingle()

    const upsertId = existingBySlug?.id ?? resolvedId
    const existing = existingBySlug

    await supabase.from('community_posts').upsert({
      id: upsertId,
      slug: resolvedSlug,
      user_email: vehicle.email ?? null,
      vehicle_data: vehicle,
      title: input.title,
      description: input.description,
      tags: input.tags,
      vibe: input.vibe,
      status: input.status,
      state: input.state,
      hero_image: heroImage,
      gallery,
      hero_frame: input.heroFrame ?? null,
      links: input.links,
      progress_percent: progressPercent,
      created_at: existing?.created_at ?? now,
      updated_at: now,
      published_at: input.state === 'published' ? (existing?.published_at ?? now) : null,
    })
  } catch {
    // silently fail — localStorage version is already saved
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteCommunityPost(postId: string): Promise<void> {
  // Mark deleted locally so it's filtered out even if Supabase delete fails
  markPostDeleted(postId)

  // Remove from localStorage posts
  const posts = loadCommunityPosts()
  saveCommunityPosts(posts.filter((p) => p.id !== postId))

  // Best-effort remove from Supabase (may fail due to RLS — that's ok, blocklist handles it)
  try {
    await supabase.from('community_posts').delete().eq('id', postId)
  } catch {}
}

// ── localStorage upsert ───────────────────────────────────────────────────────

export function upsertCommunityPost(input: PublishCommunityInput) {
  const posts = loadCommunityPosts()
  const now = new Date().toISOString()
  const baseSlug = slugify(input.title || `build-${input.vehicleId}`)
  // Only find existing post if explicitly editing (postId or slug provided)
  // Don't auto-match by vehicleId - that causes new posts to overwrite existing ones
  const existingPost = input.postId
    ? posts.find((post) => post.id === input.postId)
    : input.slug
      ? posts.find((post) => post.slug === input.slug)
      : undefined
  const currentId = existingPost?.id ?? createId('community')
  let slug = existingPost?.slug ?? baseSlug

  if (!existingPost || existingPost.title !== input.title) {
    let attempt = baseSlug
    let index = 2
    while (posts.some((post) => post.slug === attempt && post.id !== currentId)) {
      attempt = `${baseSlug}-${index}`
      index += 1
    }
    slug = attempt
  }

  const nextPost: CommunityPost = {
    id: currentId,
    slug,
    vehicleId: existingPost?.vehicleId ?? input.vehicleId,
    title: input.title,
    description: input.description,
    tags: input.tags,
    vibe: input.vibe,
    status: input.status,
    state: input.state,
    heroImage: input.heroImage,
    gallery: input.gallery,
    heroFrame: input.heroFrame,
    links: input.links,
    createdAt: existingPost?.createdAt ?? now,
    updatedAt: now,
    publishedAt: input.state === 'published' ? existingPost?.publishedAt ?? now : null,
  }

  const nextPosts = existingPost
    ? posts.map((post) => (post.id === existingPost.id ? nextPost : post))
    : [nextPost, ...posts]

  saveCommunityPosts(nextPosts)
  return nextPost
}
