import { SavedVehicle, getVehicleLabel, loadCheckedParts, loadVehicles } from './garage'
import { supabase } from './supabase'

export const COMMUNITY_POSTS_KEY = 'modvora_community_posts'

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
    currentMods: 'Intake, wheels, brake pads',
    notes: 'Weekend-focused',
    createdAt: '2026-02-20T10:00:00.000Z',
    updatedAt: '2026-03-10T10:00:00.000Z',
  },
]

const samplePosts: CommunityPost[] = [
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
    if (error || !data) return samples

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
    return [...samples, ...remote.filter((r) => !sampleIds.has(r.id))]
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
    const { data: existing } = await supabase
      .from('community_posts')
      .select('created_at, published_at')
      .eq('id', resolvedId)
      .maybeSingle()

    await supabase.from('community_posts').upsert({
      id: resolvedId,
      slug: resolvedSlug,
      user_email: vehicle.email ?? null,
      vehicle_data: vehicle,
      title: input.title,
      description: input.description,
      tags: input.tags,
      vibe: input.vibe,
      status: input.status,
      state: input.state,
      hero_image: input.heroImage,
      gallery: input.gallery,
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

// ── localStorage upsert ───────────────────────────────────────────────────────

export function upsertCommunityPost(input: PublishCommunityInput) {
  const posts = loadCommunityPosts()
  const now = new Date().toISOString()
  const baseSlug = slugify(input.title || `build-${input.vehicleId}`)
  const existingPost = input.postId
    ? posts.find((post) => post.id === input.postId)
    : input.slug
      ? posts.find((post) => post.slug === input.slug)
      : posts.find((post) => post.vehicleId === input.vehicleId)
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
