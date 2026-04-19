'use client'

import { useEffect, useRef, useState } from 'react'

const DB_NAME = 'modvora-local-images'
const STORE_NAME = 'images'
const DB_VERSION = 1
export const LOCAL_IMAGE_REF_PREFIX = 'mod-local-image:'

export interface LocalImageRecord {
  id: string
  blob: Blob
  fileName: string
  mimeType: string
  size: number
  createdAt: string
  updatedAt: string
}

export interface SaveLocalImageInput {
  blob: Blob
  fileName?: string
  mimeType?: string
}

function canUseIndexedDb() {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined'
}

function createImageId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function promisifyRequest<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

async function openDb() {
  if (!canUseIndexedDb()) throw new Error('IndexedDB is not available in this browser')

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open local image database'))
  })
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => Promise<T>) {
  const db = await openDb()

  try {
    const transaction = db.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)
    const result = await run(store)

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'))
      transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'))
    })

    return result
  } finally {
    db.close()
  }
}

export function isLocalImageRef(value: string) {
  return value.startsWith(LOCAL_IMAGE_REF_PREFIX)
}

export function createLocalImageRef(id: string) {
  return `${LOCAL_IMAGE_REF_PREFIX}${id}`
}

export function getLocalImageId(value: string) {
  return isLocalImageRef(value) ? value.slice(LOCAL_IMAGE_REF_PREFIX.length) : ''
}

export async function saveLocalImage(input: SaveLocalImageInput) {
  const blob = input.blob
  const mimeType = input.mimeType || blob.type || 'application/octet-stream'
  const fileName = input.fileName?.trim() || 'community-photo'
  const now = new Date().toISOString()
  const id = createImageId()
  const record: LocalImageRecord = {
    id,
    blob,
    fileName,
    mimeType,
    size: blob.size,
    createdAt: now,
    updatedAt: now,
  }

  await withStore('readwrite', async (store) => {
    await promisifyRequest(store.put(record))
    return undefined
  })

  return createLocalImageRef(id)
}

export async function saveLocalImageFile(file: File) {
  return saveLocalImage({
    blob: file,
    fileName: file.name,
    mimeType: file.type,
  })
}

export async function getLocalImageRecord(refOrId: string) {
  const id = isLocalImageRef(refOrId) ? getLocalImageId(refOrId) : refOrId
  if (!id) return null

  return withStore('readonly', async (store) => {
    const result = await promisifyRequest(store.get(id) as IDBRequest<LocalImageRecord | undefined>)
    return result ?? null
  })
}

export async function deleteLocalImage(refOrId: string) {
  const id = isLocalImageRef(refOrId) ? getLocalImageId(refOrId) : refOrId
  if (!id) return

  await withStore('readwrite', async (store) => {
    await promisifyRequest(store.delete(id))
    return undefined
  })
}

function dataUrlToBlob(dataUrl: string) {
  const [header, body] = dataUrl.split(',')
  if (!header || !body) throw new Error('Invalid data URL')

  const mimeType = header.match(/data:([^;]+);base64/i)?.[1] || 'application/octet-stream'
  const binary = atob(body)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: mimeType })
}

export async function migrateDataUrlToLocalImage(dataUrl: string, options?: { fileName?: string; mimeType?: string }) {
  const blob = dataUrlToBlob(dataUrl)
  return saveLocalImage({
    blob,
    fileName: options?.fileName,
    mimeType: options?.mimeType || blob.type,
  })
}

export async function uploadLocalImageToStorage(
  ref: string,
  uploadFn: (blob: Blob, mimeType: string, id: string) => Promise<string | null>,
): Promise<string | null> {
  if (!isLocalImageRef(ref)) return ref
  try {
    const record = await getLocalImageRecord(ref)
    if (!record) return null
    return await uploadFn(record.blob, record.mimeType, record.id)
  } catch {
    return null
  }
}

// Compress a local image ref to a small JPEG data URL suitable for storing in Supabase.
// Targets < 400 KB to stay well within REST API limits.
export async function resolveLocalImageToDataUrl(ref: string): Promise<string> {
  if (!isLocalImageRef(ref)) return ref
  try {
    const record = await getLocalImageRecord(ref)
    if (!record) return ref

    return await new Promise<string>((resolve) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(record.blob)

      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        const maxDim = 1200
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height, 1))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(ref); return }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // Reduce quality until data URL is under ~400 KB (base64 is ~1.37x raw)
        const maxBytes = 400 * 1024 * 1.37
        let quality = 0.82
        let dataUrl = canvas.toDataURL('image/jpeg', quality)
        while (dataUrl.length > maxBytes && quality > 0.25) {
          quality -= 0.08
          dataUrl = canvas.toDataURL('image/jpeg', quality)
        }
        resolve(dataUrl)
      }

      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(ref) }
      img.src = objectUrl
    })
  } catch {
    return ref
  }
}

export function useResolvedImageMap(images: string[]) {
  // Use a primitive string as dep so React compares by value, not reference
  const key = images.filter(Boolean).sort().join('\0')
  const [resolved, setResolved] = useState<Record<string, string>>({})
  const lastKeyRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    // Guard against concurrent-mode re-runs with same key
    if (key === lastKeyRef.current) return

    let cancelled = false
    const objectUrls: string[] = []
    const imageList = Array.from(new Set(images.filter(Boolean)))

    async function resolveImages() {
      const next: Record<string, string> = {}

      for (const image of imageList) {
        if (!image) continue

        if (!isLocalImageRef(image)) {
          next[image] = image
          continue
        }

        try {
          const record = await getLocalImageRecord(image)
          if (!record) continue
          const objectUrl = URL.createObjectURL(record.blob)
          objectUrls.push(objectUrl)
          next[image] = objectUrl
        } catch {
          // Ignore bad/missing local image refs so the rest of the UI still renders.
        }
      }

      if (!cancelled) {
        lastKeyRef.current = key
        setResolved(next)
      }
    }

    void resolveImages()

    return () => {
      cancelled = true
      objectUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return resolved
}
