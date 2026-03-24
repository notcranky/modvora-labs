'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react'
import { getVehicleLabel, loadVehicles, SavedVehicle } from '@/lib/garage'
import HeroFrameEditor from '@/components/HeroFrameEditor'
import { getCommunityDraftsForVehicle, getEditableCommunityPost, upsertCommunityPost, publishToSupabase, CommunityBuildStatus, CommunityHeroFrame, CommunityPublishState } from '@/lib/community'
import { isLocalImageRef, migrateDataUrlToLocalImage, saveLocalImageFile, useResolvedImageMap } from '@/lib/local-images'

const MAX_PHOTO_COUNT = 12
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]
const ACCEPTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'avif']
const PREVIEW_LIMIT = 6

function getFileExtension(filename: string) {
  const normalized = filename.trim().toLowerCase()
  const parts = normalized.split('.')
  return parts.length > 1 ? parts.at(-1) ?? '' : ''
}

function formatUploadFileLabel(file: File) {
  const name = file.name.trim()
  return name || 'Camera photo'
}

function isHeicLikeFile(file: File) {
  const extension = getFileExtension(file.name)
  return ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'].includes(file.type) || ['heic', 'heif'].includes(extension)
}

function isAcceptedImageFile(file: File) {
  if (ACCEPTED_IMAGE_TYPES.includes(file.type)) return true
  if (file.type.startsWith('image/')) return true

  const extension = getFileExtension(file.name)
  return ACCEPTED_IMAGE_EXTENSIONS.includes(extension)
}

function canPreviewImageFile(file: File) {
  return !isHeicLikeFile(file)
}

type ImageMeta = {
  fileName: string
  mimeType: string
  canPreview: boolean
  previewUrl?: string
}

function getFrameImageStyle(frame: CommunityHeroFrame) {
  return {
    objectPosition: `${frame.x}% ${frame.y}%`,
    transform: `scale(${Math.max(frame.zoom, 1)})`,
  }
}

function getHeroPreviewHeightClass(orientation?: CommunityHeroFrame['orientation']) {
  return orientation === 'portrait' ? 'h-80 sm:h-[26rem]' : 'h-56 sm:h-64'
}

function normalizeImageUrl(value: string) {
  const input = value.trim()
  if (!input) return ''
  if (input.startsWith('data:image/') || isLocalImageRef(input)) return input

  try {
    const url = new URL(input)

    if (url.hostname.includes('dropbox.com')) {
      url.searchParams.set('raw', '1')
      url.searchParams.delete('dl')
      return url.toString()
    }

    if (url.hostname === 'drive.google.com') {
      const idFromPath = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1]
      const idFromQuery = url.searchParams.get('id')
      const id = idFromPath || idFromQuery
      if (id) return `https://drive.google.com/uc?export=view&id=${id}`
    }

    if (url.hostname === 'imgur.com') {
      const id = url.pathname.replace(/^\/+/, '').split('/')[0]
      if (id) return `https://i.imgur.com/${id}.jpg`
    }

    return url.toString()
  } catch {
    return input
  }
}

function looksLikeImageUrl(value: string) {
  const input = value.trim()
  if (!input) return false
  if (input.startsWith('data:image/') || isLocalImageRef(input)) return true

  try {
    const url = new URL(input)
    const pathname = url.pathname.toLowerCase()

    if (/\.(jpg|jpeg|png|webp|gif|avif)$/i.test(pathname)) return true
    if (url.hostname.includes('unsplash.com')) return true
    if (url.hostname.includes('images.')) return true
    if (url.hostname.includes('imgur.com')) return true
    if (url.hostname.includes('drive.google.com')) return true
    if (url.hostname.includes('dropbox.com')) return true
    if (pathname.includes('/photo-')) return true

    return false
  } catch {
    return false
  }
}

function parseLines(value: string) {
  return value
    .split(/\r?\n|,/) 
    .map((item) => normalizeImageUrl(item))
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseLinks(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelPart, ...urlParts] = line.split('|')
      const label = labelPart?.trim() || 'External link'
      const url = urlParts.join('|').trim()
      return url ? { label, url } : null
    })
    .filter((item): item is { label: string; url: string } => Boolean(item))
}

const placeholderImages = [
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=1600&q=80',
]

const defaultHeroFrame: CommunityHeroFrame = { x: 50, y: 50, zoom: 1, orientation: 'landscape' }

function ImageThumb({
  image,
  alt,
  className,
  meta,
  frame,
}: {
  image: string
  alt: string
  className: string
  meta?: ImageMeta
  frame?: CommunityHeroFrame
}) {
  if (meta && !meta.canPreview) {
    return (
      <div className={`flex flex-col items-center justify-center bg-[linear-gradient(180deg,#171720_0%,#111116_100%)] px-5 text-center ${className}`}>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">🖼️</div>
        <p className="mt-3 text-sm font-medium text-white">Preview not available in this browser</p>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-zinc-400">{meta.fileName || 'HEIC/HEIF upload'} is saved locally and will stay attached to the post.</p>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden bg-[#111116] ${className}`}>
      <img
        src={meta?.previewUrl || image}
        alt={alt}
        className="h-full w-full object-cover"
        style={frame ? getFrameImageStyle(frame) : undefined}
      />
    </div>
  )
}

function buildPrefillForVehicle(vehicle: SavedVehicle | undefined) {
  return {
    title: vehicle ? `${getVehicleLabel(vehicle)} Build` : '',
    description: vehicle?.goals ?? '',
    tags: '',
    vibe: '',
    status: 'in-progress' as CommunityBuildStatus,
    state: 'published' as CommunityPublishState,
    heroImage: '',
    heroFrame: defaultHeroFrame,
    galleryInput: '',
    linksInput: '',
    resultSlug: '',
    postId: '',
    lockedVehicleId: '',
  }
}

export default function PublishBuild({ initialVehicleId, initialEditSlug }: { initialVehicleId?: string; initialEditSlug?: string }) {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<SavedVehicle[]>([])
  const [vehicleId, setVehicleId] = useState(initialVehicleId ?? '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [vibe, setVibe] = useState('')
  const [status, setStatus] = useState<CommunityBuildStatus>('in-progress')
  const [state, setState] = useState<CommunityPublishState>('published')
  const [heroImage, setHeroImage] = useState('')
  const [heroFrame, setHeroFrame] = useState<CommunityHeroFrame>(defaultHeroFrame)
  const [galleryInput, setGalleryInput] = useState('')
  const [linksInput, setLinksInput] = useState('')
  const [resultSlug, setResultSlug] = useState('')
  const [postId, setPostId] = useState('')
  const [lockedVehicleId, setLockedVehicleId] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [isImportingPhotos, setIsImportingPhotos] = useState(false)
  const [imageMeta, setImageMeta] = useState<Record<string, ImageMeta>>({})
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const isImportingPhotosRef = useRef(false)

  useEffect(() => {
    const nextVehicles = loadVehicles()
    setVehicles(nextVehicles)

    const editablePost = initialEditSlug ? getEditableCommunityPost(initialEditSlug) : null
    const chosen = editablePost?.vehicleId
      ?? (initialVehicleId && nextVehicles.some((vehicle) => vehicle.id === initialVehicleId)
        ? initialVehicleId
        : nextVehicles[0]?.id ?? '')

    setVehicleId(chosen)
  }, [initialEditSlug, initialVehicleId])

  useEffect(() => {
    if (!vehicles.length || !vehicleId) return

    const vehicle = vehicles.find((entry) => entry.id === vehicleId)
    const editablePost = initialEditSlug ? getEditableCommunityPost(initialEditSlug) : null

    if (editablePost) {
      setVehicleId(editablePost.vehicleId)
      setTitle(editablePost.title)
      setDescription(editablePost.description)
      setTags(editablePost.tags.join(', '))
      setVibe(editablePost.vibe)
      setStatus(editablePost.status)
      setState(editablePost.state)
      setHeroImage(editablePost.heroImage)
      setHeroFrame(editablePost.heroFrame ?? defaultHeroFrame)
      setGalleryInput(editablePost.gallery.filter((image) => image !== editablePost.heroImage).join('\n'))
      setLinksInput(editablePost.links.map((link) => `${link.label} | ${link.url}`).join('\n'))
      setResultSlug(editablePost.slug)
      setPostId(editablePost.id)
      setLockedVehicleId(editablePost.vehicleId)
      setPhotoError('')
      setSubmitError('')
      return
    }

    const existing = getCommunityDraftsForVehicle(vehicleId)[0]
    const fallback = buildPrefillForVehicle(vehicle)

    setTitle(existing?.title ?? fallback.title)
    setDescription(existing?.description ?? fallback.description)
    setTags(existing?.tags.join(', ') ?? fallback.tags)
    setVibe(existing?.vibe ?? fallback.vibe)
    setStatus(existing?.status ?? fallback.status)
    setState(existing?.state ?? fallback.state)
    setHeroImage(existing?.heroImage ?? fallback.heroImage)
    setHeroFrame(existing?.heroFrame ?? fallback.heroFrame)
    setGalleryInput(existing?.gallery.filter((image) => image !== existing?.heroImage).join('\n') ?? fallback.galleryInput)
    setLinksInput(existing?.links.map((link) => `${link.label} | ${link.url}`).join('\n') ?? fallback.linksInput)
    setResultSlug(existing?.slug ?? fallback.resultSlug)
    setPostId(existing?.id ?? fallback.postId)
    setLockedVehicleId(fallback.lockedVehicleId)
    setPhotoError('')
    setSubmitError('')
  }, [initialEditSlug, vehicleId, vehicles])

  const selectedVehicle = useMemo(() => vehicles.find((vehicle) => vehicle.id === vehicleId) ?? null, [vehicleId, vehicles])
  const isEditing = Boolean(postId)
  const editLocked = Boolean(lockedVehicleId)

  const parsedGallery = useMemo(() => parseLines(galleryInput), [galleryInput])
  const normalizedHero = useMemo(() => normalizeImageUrl(heroImage), [heroImage])
  const allImages = useMemo(() => {
    const merged = [normalizedHero, ...parsedGallery].map((image) => normalizeImageUrl(image)).filter(Boolean)
    return Array.from(new Set(merged)).slice(0, MAX_PHOTO_COUNT)
  }, [normalizedHero, parsedGallery])
  const previewImages = allImages.slice(0, PREVIEW_LIMIT)
  const resolvedImageMap = useResolvedImageMap(allImages)
  const nonDirectOptionalCount = parsedGallery.filter((url) => !looksLikeImageUrl(url) && !isLocalImageRef(url)).length
  const hasLocalOnlyImages = allImages.some((image) => image.startsWith('data:image/') || isLocalImageRef(image))
  const hasUnsupportedPreviewUpload = allImages.some((image) => imageMeta[image] && !imageMeta[image].canPreview)
  const remainingPhotoSlots = Math.max(0, MAX_PHOTO_COUNT - allImages.length)
  const hasEnoughToPreview = previewImages.length > 0

  function syncImages(nextImages: string[]) {
    const unique = Array.from(new Set(nextImages.map((image) => normalizeImageUrl(image)).filter(Boolean))).slice(0, MAX_PHOTO_COUNT)
    const nextHero = unique[0] ?? ''
    setHeroImage((currentHero) => {
      if (currentHero && currentHero !== nextHero) setHeroFrame(defaultHeroFrame)
      return nextHero
    })
    if (!nextHero) setHeroFrame(defaultHeroFrame)
    setGalleryInput(unique.slice(1).join('\n'))
  }

  async function addFiles(fileList: FileList | File[]) {
    if (isImportingPhotosRef.current) return

    const files = Array.from(fileList)
    if (!files.length) return

    const currentCount = allImages.length
    const availableSlots = Math.max(0, MAX_PHOTO_COUNT - currentCount)
    if (!availableSlots) {
      setPhotoError(`You can add up to ${MAX_PHOTO_COUNT} photos for now.`)
      return
    }

    const accepted = files.filter((file) => isAcceptedImageFile(file))
    const rejectedTypeCount = files.length - accepted.length
    const oversized = accepted.filter((file) => file.size > MAX_FILE_SIZE_BYTES)
    const dedupedBySelection = Array.from(new Map(
      accepted
        .filter((file) => file.size <= MAX_FILE_SIZE_BYTES)
        .map((file) => [`${file.name}-${file.size}-${file.lastModified}`, file]),
    ).values())
    const usable = dedupedBySelection.slice(0, availableSlots)

    if (!usable.length) {
      setPhotoError(rejectedTypeCount > 0
        ? 'Use JPG, JPEG, PNG, WEBP, GIF, HEIC, HEIF, or AVIF images.'
        : `Photos need to stay under ${Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB each for local saves.`)
      return
    }

    isImportingPhotosRef.current = true
    setIsImportingPhotos(true)
    setPhotoError('')

    try {
      const imported = await Promise.all(usable.map(async (file) => ({
        src: await saveLocalImageFile(file),
        fileName: formatUploadFileLabel(file),
        mimeType: file.type || `image/${getFileExtension(file.name) || 'unknown'}`,
        canPreview: canPreviewImageFile(file),
        previewUrl: canPreviewImageFile(file) ? URL.createObjectURL(file) : undefined,
      })))

      const existingImages = new Set(allImages)
      const uniqueImported = imported.filter((item) => !existingImages.has(item.src))
      imported
        .filter((item) => existingImages.has(item.src) && item.previewUrl)
        .forEach((item) => URL.revokeObjectURL(item.previewUrl as string))
      const nextMeta = Object.fromEntries(uniqueImported.map((item) => [item.src, {
        fileName: item.fileName,
        mimeType: item.mimeType,
        canPreview: item.canPreview,
        previewUrl: item.previewUrl,
      }]))

      setImageMeta((current) => ({ ...current, ...nextMeta }))
      syncImages([...allImages, ...uniqueImported.map((item) => item.src)])

      const notes: string[] = []
      const heicCount = uniqueImported.filter((item) => !item.canPreview).length
      const duplicateCount = imported.length - uniqueImported.length
      if (rejectedTypeCount > 0) notes.push(`${rejectedTypeCount} file${rejectedTypeCount === 1 ? '' : 's'} skipped (not an image)`)
      if (oversized.length > 0) notes.push(`${oversized.length} skipped for being too large`)
      if (duplicateCount > 0) notes.push(`${duplicateCount} duplicate photo${duplicateCount === 1 ? '' : 's'} skipped`)
      if (heicCount > 0) notes.push(`${heicCount} HEIC/HEIF photo${heicCount === 1 ? '' : 's'} added — preview depends on browser support`)
      if (dedupedBySelection.length > usable.length) notes.push('extra photos skipped because the gallery is full')
      setPhotoError(notes.join(' · '))
    } catch {
      setPhotoError('A photo could not be imported. Try a different image.')
    } finally {
      isImportingPhotosRef.current = false
      setIsImportingPhotos(false)
    }
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files
    if (fileList?.length) void addFiles(fileList)
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDraggingPhotos(false)
    if (event.dataTransfer.files?.length) void addFiles(event.dataTransfer.files)
  }

  function moveImage(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= allImages.length) return

    const nextImages = [...allImages]
    const [moved] = nextImages.splice(index, 1)
    nextImages.splice(targetIndex, 0, moved)
    syncImages(nextImages)
  }

  function setHeroFromIndex(index: number) {
    if (index <= 0 || index >= allImages.length) return
    const nextImages = [...allImages]
    const [selected] = nextImages.splice(index, 1)
    syncImages([selected, ...nextImages])
  }

  function removeImage(index: number) {
    const imageToRemove = allImages[index]
    if (imageToRemove) {
      setImageMeta((current) => {
        if (!current[imageToRemove]) return current
        const next = { ...current }
        if (next[imageToRemove]?.previewUrl) URL.revokeObjectURL(next[imageToRemove].previewUrl as string)
        delete next[imageToRemove]
        return next
      })
    }

    syncImages(allImages.filter((_, imageIndex) => imageIndex !== index))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSaving) return

    const submitVehicleId = lockedVehicleId || selectedVehicle?.id || vehicleId
    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()
    const validationIssues: string[] = []

    if (!submitVehicleId) validationIssues.push('Pick the linked build before saving.')
    if (!trimmedTitle) validationIssues.push('Add a post title.')
    if (!trimmedDescription) validationIssues.push('Add a short description.')

    if (validationIssues.length) {
      setSubmitError(validationIssues.join(' '))
      return
    }

    setIsSaving(true)
    setSubmitError('')

    try {
      const safeHero = normalizedHero || parsedGallery[0] || placeholderImages[0]
      const initialGallery = [safeHero, ...parsedGallery.filter((image) => image !== safeHero)].slice(0, MAX_PHOTO_COUNT)
      const persistedImages = await Promise.all(initialGallery.map(async (image, index) => {
        if (!image.startsWith('data:image/')) return image

        const meta = imageMeta[image]
        return migrateDataUrlToLocalImage(image, {
          fileName: meta?.fileName || `community-photo-${index + 1}`,
          mimeType: meta?.mimeType,
        })
      }))
      const persistedHero = persistedImages[0] || placeholderImages[0]
      const nextGallery = [persistedHero, ...persistedImages.slice(1).filter((image) => image !== persistedHero)].slice(0, MAX_PHOTO_COUNT)

      const publishInput = {
        postId: postId || undefined,
        slug: initialEditSlug,
        vehicleId: submitVehicleId,
        title: trimmedTitle,
        description: trimmedDescription,
        tags: parseLines(tags),
        vibe: vibe.trim(),
        status,
        state,
        heroImage: persistedHero,
        gallery: nextGallery.length ? nextGallery : placeholderImages,
        heroFrame,
        links: parseLinks(linksInput),
      }

      const post = upsertCommunityPost(publishInput)

      // Also save to Supabase so other users can see it
      if (selectedVehicle) {
        publishToSupabase(publishInput, selectedVehicle, 0, post.id, post.slug)
      }

      setHeroImage(safeHero)
      setGalleryInput(nextGallery.slice(1).join('\n'))
      setResultSlug(post.slug)
      setPostId(post.id)
      setLockedVehicleId(post.vehicleId)

      if (postId) {
        router.push(`/community/${post.slug}`)
        return
      }
    } catch (error) {
      const isStorageQuotaIssue = error instanceof DOMException
        && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')

      setSubmitError(isStorageQuotaIssue
        ? 'Local browser storage is full. Remove a few large photos or older local posts, then try saving again.'
        : isEditing
          ? 'Your changes could not be saved. Try again, then reopen the post to confirm the update.'
          : 'This build could not be saved right now. Try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!vehicles.length) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] px-4 pb-16 pt-24">
        <div className="mx-auto max-w-3xl rounded-[30px] border border-[#23232a] bg-[#111116] p-10 text-center">
          <div className="text-5xl">🚗</div>
          <h1 className="mt-5 text-3xl font-semibold text-white">You need a saved garage build first</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">Publishing only works from an existing vehicle/build, so the car details stay linked automatically and nobody has to retype platform info.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/intake" className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-purple-500">Create a build</Link>
            <Link href="/community" className="rounded-xl border border-[#2a2a30] px-5 py-3 font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white">Browse community</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-[#212129] bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.16),transparent_32%),linear-gradient(180deg,#141419_0%,#0d0d11_100%)] p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-purple-200">
                <span className="h-2 w-2 rounded-full bg-purple-400" />
                {isEditing ? 'Edit build post' : 'Publish build'}
              </div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{isEditing ? 'Update your community post without leaving the publish flow.' : 'Turn a saved garage build into a clean community post.'}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">{isEditing ? 'You’re editing an existing local post. The linked vehicle stays attached, the form is prefilled, and saving updates the current post instead of making a duplicate.' : 'Pick one of your saved vehicles, then add only the community layer: title, story, vibe, photos, and a few links. Vehicle details stay pulled from the garage automatically.'}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href="/dashboard" className="rounded-xl border border-[#2a2a30] px-5 py-3 font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white">Back to garage</Link>
              <Link href="/community" className="rounded-xl border border-[#2a2a30] px-5 py-3 font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white">View gallery</Link>
              {resultSlug && <Link href={`/community/${resultSlug}`} className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-purple-500">Open current post</Link>}
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="space-y-5">
            <div className="rounded-[28px] border border-[#23232a] bg-[linear-gradient(180deg,#141419_0%,#0f0f13_100%)] p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Step 1</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{editLocked ? 'Linked source build' : 'Choose the source build'}</h2>
              {editLocked && <p className="mt-2 text-sm leading-relaxed text-zinc-400">Editing keeps this post attached to its original garage build so the vehicle relationship stays intact.</p>}
              <div className="mt-5 space-y-3">
                {vehicles.map((vehicle) => {
                  const active = vehicle.id === vehicleId
                  return (
                    <button key={vehicle.id} type="button" disabled={editLocked} onClick={() => setVehicleId(vehicle.id)} className={`w-full rounded-2xl border p-4 text-left transition-colors ${active ? 'border-purple-500/35 bg-purple-600/10' : 'border-[#2a2a30] bg-black/20 hover:border-purple-500/20'} ${editLocked ? 'cursor-not-allowed opacity-80' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{getVehicleLabel(vehicle)}</p>
                          <p className="mt-1 text-xs text-zinc-500">{vehicle.focus} focus · {vehicle.budget || 'Budget not set'}</p>
                        </div>
                        {active && editLocked && <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-200">Locked</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedVehicle && (
              <div className="rounded-[28px] border border-[#23232a] bg-[linear-gradient(180deg,#131318_0%,#0f0f13_100%)] p-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Linked vehicle details</p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-2xl border border-[#23232a] bg-black/20 p-4">
                    <p className="text-xs text-zinc-500">Platform</p>
                    <p className="mt-2 font-medium text-white">{getVehicleLabel(selectedVehicle)}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[#23232a] bg-black/20 p-4">
                      <p className="text-xs text-zinc-500">Engine</p>
                      <p className="mt-2 text-zinc-300">{selectedVehicle.engine || 'Not listed'}</p>
                    </div>
                    <div className="rounded-2xl border border-[#23232a] bg-black/20 p-4">
                      <p className="text-xs text-zinc-500">Drivetrain</p>
                      <p className="mt-2 text-zinc-300">{selectedVehicle.drivetrain || 'Not listed'}</p>
                    </div>
                  </div>
                  {selectedVehicle.goals && (
                    <div className="rounded-2xl border border-purple-500/15 bg-purple-500/8 p-4">
                      <p className="text-xs text-purple-200">Goal imported from garage</p>
                      <p className="mt-2 leading-relaxed text-zinc-300">{selectedVehicle.goals}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>

          <section className="rounded-[28px] border border-[#23232a] bg-[linear-gradient(180deg,#141419_0%,#101015_100%)] p-6 sm:p-7">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Step 2</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">{isEditing ? 'Update the public-facing story' : 'Add the public-facing story'}</h2>
              </div>
              <p className="text-sm text-zinc-500">MVP local-first publish form</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {isEditing && (
                  <div className="sm:col-span-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-4 text-sm text-zinc-300">
                    <p className="font-medium text-emerald-200">Editing mode is live</p>
                    <p className="mt-2 leading-relaxed text-zinc-400">This form was prefilled from your existing local post. Saving updates that post in place and keeps its linked vehicle/build connection.</p>
                  </div>
                )}

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-zinc-300">Post title</span>
                  <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Midnight Club GR86" className="w-full rounded-2xl border border-[#2a2a30] bg-[#111116] px-4 py-3 text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/40" />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-zinc-300">Short description</span>
                  <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="What makes this build interesting?" className="w-full rounded-2xl border border-[#2a2a30] bg-[#111116] px-4 py-3 text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/40" />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-300">Vibe</span>
                  <input value={vibe} onChange={(event) => setVibe(event.target.value)} placeholder="Clean canyon car" className="w-full rounded-2xl border border-[#2a2a30] bg-[#111116] px-4 py-3 text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/40" />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-300">Tags</span>
                  <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="oem+, stance, street build" className="w-full rounded-2xl border border-[#2a2a30] bg-[#111116] px-4 py-3 text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/40" />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-300">Build status</span>
                  <select value={status} onChange={(event) => setStatus(event.target.value as CommunityBuildStatus)} className="w-full rounded-2xl border border-[#2a2a30] bg-[#111116] px-4 py-3 text-white outline-none transition-colors focus:border-purple-500/40">
                    <option value="in-progress">In progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-300">Post state</span>
                  <select value={state} onChange={(event) => setState(event.target.value as CommunityPublishState)} className="w-full rounded-2xl border border-[#2a2a30] bg-[#111116] px-4 py-3 text-white outline-none transition-colors focus:border-purple-500/40">
                    <option value="published">Published</option>
                    <option value="draft">Draft only</option>
                  </select>
                </label>

                <div className="sm:col-span-2 rounded-[26px] border border-purple-500/15 bg-[linear-gradient(180deg,rgba(101,31,255,0.1),rgba(15,15,19,0.75))] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Photos</p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-400">Drop in a few photos, reorder them, then fine-tune the hero crop. The first image becomes the cover by default, but you can swap it anytime.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-300">{allImages.length}/{MAX_PHOTO_COUNT}</span>
                      <span className="rounded-full border border-[#2a2a30] bg-[#111116] px-3 py-1 text-xs text-zinc-400">{remainingPhotoSlots} slot{remainingPhotoSlots === 1 ? '' : 's'} left</span>
                    </div>
                  </div>

                  <div
                    onDragOver={(event) => {
                      event.preventDefault()
                      setIsDraggingPhotos(true)
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault()
                      setIsDraggingPhotos(false)
                    }}
                    onDrop={handleDrop}
                    className={`mt-4 rounded-[24px] border border-dashed p-6 text-center transition-colors ${isDraggingPhotos ? 'border-purple-400 bg-purple-500/10' : 'border-[#353541] bg-black/20'}`}
                  >
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.avif,.heic,.heif" multiple className="hidden" onChange={handleFileSelection} />
                    <div className="mx-auto flex max-w-xl flex-col items-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">📸</div>
                      <h3 className="mt-4 text-lg font-semibold text-white">Drop photos here</h3>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-400">Or pick them from your camera roll, desktop, or gallery. Normal camera filenames are fine — imported images save locally on this device, so the flow stays simple and fast.</p>
                      <div className="mt-5 flex flex-wrap justify-center gap-3">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500">Choose photos</button>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-xl border border-[#2a2a30] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white">Open gallery</button>
                      </div>
                      <div className="mt-4 flex flex-wrap justify-center gap-2 text-[11px] text-zinc-500">
                        <span className="rounded-full border border-[#2a2a30] bg-[#111116] px-2.5 py-1">Up to {Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB each</span>
                        <span className="rounded-full border border-[#2a2a30] bg-[#111116] px-2.5 py-1">Local-first uploads</span>
                        <span className="rounded-full border border-[#2a2a30] bg-[#111116] px-2.5 py-1">Drag, reorder, hero frame</span>
                      </div>
                      {hasUnsupportedPreviewUpload && <p className="mt-3 text-xs text-zinc-400">HEIC/HEIF uploads are saved normally, but some browsers can’t render a live preview yet.</p>}
                      {isImportingPhotos && <p className="mt-3 text-xs text-purple-200">Importing photos…</p>}
                      {photoError && <p className="mt-3 text-xs text-amber-300">{photoError}</p>}
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-[#23232a] bg-black/20 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Optional photo URL</p>
                        <p className="mt-1 text-xs text-zinc-500">Still supported for hosted images, but it’s secondary now.</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                      <input value={heroImage && !heroImage.startsWith('data:image/') && !isLocalImageRef(heroImage) ? heroImage : ''} onChange={(event) => setHeroImage(event.target.value)} placeholder="Paste one hosted image URL if you want" className="min-w-0 flex-1 rounded-2xl border border-[#2a2a30] bg-[#111116] px-4 py-3 text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/40" />
                      <button type="button" onClick={() => syncImages([heroImage, ...parsedGallery])} className="rounded-xl border border-[#2a2a30] px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white">Use as hero</button>
                    </div>
                    {heroImage && !heroImage.startsWith('data:image/') && !isLocalImageRef(heroImage) && !looksLikeImageUrl(normalizeImageUrl(heroImage)) && (
                      <p className="mt-2 text-xs text-amber-300">That link doesn’t look like a direct image URL yet. It may still work if it’s Dropbox/Drive/Imgur, but if preview fails you’ll want the actual image file link.</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2 rounded-[24px] border border-[#23232a] bg-[#0f0f13] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">Photo preview</p>
                      <p className="mt-1 text-xs text-zinc-500">The first image becomes the hero image on the post page.</p>
                    </div>
                    <span className="rounded-full border border-[#2a2a30] bg-[#111116] px-3 py-1 text-xs text-zinc-400">{allImages.length} image{allImages.length === 1 ? '' : 's'}</span>
                  </div>

                  {previewImages.length ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {previewImages.map((image, index) => {
                        const meta = imageMeta[image]

                        return (
                          <div key={`${image.slice(0, 40)}-${index}`} className={`overflow-hidden rounded-2xl border border-[#23232a] bg-black/20 ${index === 0 ? 'sm:col-span-2' : ''}`}>
                            <ImageThumb
                              image={resolvedImageMap[image] || image}
                              alt={index === 0 ? 'Hero image preview' : `Gallery image ${index}`}
                              meta={meta}
                              frame={index === 0 ? heroFrame : undefined}
                              className={index === 0 ? getHeroPreviewHeightClass(heroFrame.orientation) : 'h-40'}
                            />
                            <div className="flex items-center justify-between gap-3 border-t border-[#23232a] px-3 py-3 text-[11px] text-zinc-400">
                              <span>{index === 0 ? 'Hero image' : `Gallery image ${index}`}</span>
                              <div className="flex items-center gap-2">
                                {meta && !meta.canPreview && <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-zinc-300">Preview limited</span>}
                                {(image.startsWith('data:image/') || isLocalImageRef(image)) && <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-emerald-200">Local</span>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-[#2a2a30] bg-black/20 p-5 text-sm text-zinc-500">
                      Add photos from your device or a hosted image URL to preview how the post will look.
                    </div>
                  )}
                </div>

                {hasEnoughToPreview && normalizedHero && (
                  <div className="sm:col-span-2">
                    <HeroFrameEditor image={resolvedImageMap[normalizedHero] || normalizedHero} frame={heroFrame} onChange={setHeroFrame} />
                  </div>
                )}

                <div className="sm:col-span-2 rounded-[24px] border border-[#23232a] bg-[#0f0f13] p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Manage gallery</p>
                      <p className="mt-1 text-xs text-zinc-500">Reorder photos, set the hero image, or remove shots you don’t want in the post.</p>
                    </div>
                    {hasLocalOnlyImages && <span className="text-xs text-zinc-500">Local images stay on this browser/device.</span>}
                  </div>

                  {allImages.length ? (
                    <div className="mt-4 space-y-3">
                      {allImages.map((image, index) => {
                        const meta = imageMeta[image]

                        return (
                          <div key={`${image.slice(0, 40)}-manage-${index}`} className="flex flex-col gap-3 rounded-2xl border border-[#23232a] bg-black/20 p-3 sm:flex-row sm:items-center">
                            <div className="w-full shrink-0 overflow-hidden rounded-2xl border border-[#23232a] bg-[#111116] sm:w-28">
                              <ImageThumb
                                image={resolvedImageMap[image] || image}
                                alt={index === 0 ? 'Hero image thumbnail' : `Photo ${index + 1}`}
                                meta={meta}
                                frame={index === 0 ? heroFrame : undefined}
                                className="h-20"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-[#2a2a30] bg-[#111116] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-zinc-400">{index === 0 ? 'Hero image' : `Photo ${index + 1}`}</span>
                                {(image.startsWith('data:image/') || isLocalImageRef(image)) && <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-emerald-200">Local upload</span>}
                                {!image.startsWith('data:image/') && !isLocalImageRef(image) && <span className="rounded-full border border-[#2a2a30] bg-[#111116] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-zinc-500">Hosted</span>}
                                {meta && !meta.canPreview && <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-zinc-300">Preview limited</span>}
                              </div>
                              <p className="mt-2 truncate text-xs text-zinc-500">{(image.startsWith('data:image/') || isLocalImageRef(image)) ? (meta?.fileName || 'Imported from this device') : image}</p>
                              {meta && !meta.canPreview && <p className="mt-1 text-[11px] text-zinc-500">Saved locally — this browser just can’t render the live HEIC/HEIF preview.</p>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} className="rounded-xl border border-[#2a2a30] px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">Move up</button>
                              <button type="button" onClick={() => moveImage(index, 1)} disabled={index === allImages.length - 1} className="rounded-xl border border-[#2a2a30] px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">Move down</button>
                              <button type="button" onClick={() => setHeroFromIndex(index)} disabled={index === 0} className="rounded-xl border border-[#2a2a30] px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">Make hero</button>
                              <button type="button" onClick={() => removeImage(index)} className="rounded-xl border border-red-500/25 px-3 py-2 text-xs font-medium text-red-200 transition-colors hover:bg-red-500/10">Remove</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-[#2a2a30] bg-black/20 p-5 text-sm text-zinc-500">
                      No photos added yet. Drop images above or choose them from your device.
                    </div>
                  )}
                </div>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-zinc-300">Extra links</span>
                  <textarea value={linksInput} onChange={(event) => setLinksInput(event.target.value)} rows={4} placeholder="Instagram | https://instagram.com/...&#10;YouTube walkaround | https://youtube.com/..." className="w-full rounded-2xl border border-[#2a2a30] bg-[#111116] px-4 py-3 text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500/40" />
                </label>

                {nonDirectOptionalCount > 0 && (
                  <div className="sm:col-span-2 rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4 text-xs text-amber-200">
                    {nonDirectOptionalCount} hosted gallery link{nonDirectOptionalCount === 1 ? '' : 's'} may not be direct image URLs.
                  </div>
                )}
              </div>

              {submitError && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4 text-sm text-amber-200">
                  {submitError}
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <button type="submit" disabled={isSaving} className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-70">{isSaving ? (isEditing ? 'Saving changes…' : 'Saving…') : (isEditing ? 'Save changes' : `Save ${state === 'published' ? '& publish' : 'draft'}`)}</button>
                <Link href={resultSlug ? `/community/${resultSlug}` : '/community'} className="rounded-xl border border-[#2a2a30] px-5 py-3 font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white">{isEditing ? 'Back to post' : 'Cancel'}</Link>
              </div>
            </form>

            {resultSlug && (
              <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/8 p-4">
                <p className="text-sm font-medium text-green-300">{isEditing ? 'Build post updated locally.' : 'Build saved locally.'}</p>
                <p className="mt-1 text-sm text-zinc-300">Your {state === 'published' ? (isEditing ? 'community post changes are live in the local gallery' : 'community post is live in the local gallery') : 'draft is saved locally'} for this device.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {state === 'published' && <Link href={`/community/${resultSlug}`} className="rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-green-400">Open showcase</Link>}
                  <Link href="/community" className="rounded-xl border border-[#2a2a30] px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white">View gallery</Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
