// Offline mode, caching, and performance optimization
// Service Worker integration and IndexedDB storage

import { supabase } from './supabase'

// ===== CACHE STRATEGIES =====
export type CacheStrategy = 'network-first' | 'cache-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only'

interface CacheConfig {
  maxAge: number // milliseconds
  maxItems: number
  strategy: CacheStrategy
}

const DEFAULT_CACHE_CONFIG: Record<string, CacheConfig> = {
  'posts': { maxAge: 5 * 60 * 1000, maxItems: 100, strategy: 'stale-while-revalidate' }, // 5 min
  'profiles': { maxAge: 15 * 60 * 1000, maxItems: 500, strategy: 'stale-while-revalidate' }, // 15 min
  'stats': { maxAge: 2 * 60 * 1000, maxItems: 200, strategy: 'network-first' }, // 2 min
  'likes': { maxAge: 30 * 1000, maxItems: 1000, strategy: 'network-first' }, // 30 sec
  'comments': { maxAge: 60 * 1000, maxItems: 500, strategy: 'network-first' }, // 1 min
  'search': { maxAge: 10 * 60 * 1000, maxItems: 50, strategy: 'stale-while-revalidate' }, // 10 min
  'images': { maxAge: 7 * 24 * 60 * 60 * 1000, maxItems: 500, strategy: 'cache-first' } // 7 days
}

// ===== INDEXEDDB CACHE =====
const DB_NAME = 'modvora-cache'
const DB_VERSION = 1
const STORE_NAME = 'api-cache'

interface CacheEntry {
  key: string
  data: any
  timestamp: number
  etag?: string
  expiresAt: number
}

class IndexedDBCache {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise
    if (this.db) return

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' })
          store.createIndex('expiresAt', 'expiresAt', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })

    return this.initPromise
  }

  async get(key: string): Promise<CacheEntry | null> {
    await this.init()
    if (!this.db) return null

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(key)
      
      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined
        if (!entry) return resolve(null)
        
        // Check if expired
        if (entry.expiresAt < Date.now()) {
          this.delete(key)
          return resolve(null)
        }
        
        resolve(entry)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async set(key: string, data: any, config: CacheConfig): Promise<void> {
    await this.init()
    if (!this.db) return

    const entry: CacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + config.maxAge
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(entry)
      
      request.onsuccess = () => {
        // Clean up old entries if over limit
        this.cleanup(config)
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async delete(key: string): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(key)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async cleanup(config: CacheConfig): Promise<void> {
    if (!this.db) return

    const transaction = this.db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('timestamp')
    
    const request = index.openCursor()
    let count = 0
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue
      if (!cursor) return
      
      count++
      if (count > config.maxItems) {
        cursor.delete()
        cursor.continue()
      }
    }
  }

  async clear(): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

// Singleton instance
const cache = new IndexedDBCache()

// ===== SMART CACHED FETCH =====
export async function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  cacheKey: keyof typeof DEFAULT_CACHE_CONFIG = 'posts'
): Promise<T> {
  const config = DEFAULT_CACHE_CONFIG[cacheKey]
  
  // Check if online
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
  
  const cached = await cache.get(key)
  
  switch (config.strategy) {
    case 'cache-first':
      if (cached) return cached.data
      if (!isOnline) throw new Error('Offline - no cached data')
      const freshData = await fetchFn()
      await cache.set(key, freshData, config)
      return freshData
      
    case 'network-first':
      if (!isOnline && cached) return cached.data
      try {
        const networkData = await fetchFn()
        await cache.set(key, networkData, config)
        return networkData
      } catch (error) {
        if (cached) return cached.data
        throw error
      }
      
    case 'stale-while-revalidate':
      // Return cached immediately, refresh in background
      const promise = fetchFn().then(async (data) => {
        await cache.set(key, data, config)
        return data
      }).catch(() => cached?.data)
      
      if (cached) {
        // Refresh in background
        promise.then(() => {})
        return cached.data
      }
      return promise
      
    case 'network-only':
      if (!isOnline) throw new Error('Offline')
      return fetchFn()
      
    case 'cache-only':
      if (!cached) throw new Error('No cached data')
      return cached.data
      
    default:
      return fetchFn()
  }
}

// ===== OFFLINE QUEUE =====
interface QueuedAction {
  id: string
  type: 'like' | 'comment' | 'follow' | 'post' | 'save'
  data: any
  timestamp: number
  retryCount: number
}

class OfflineQueue {
  private queue: QueuedAction[] = []
  private isProcessing = false
  private listeners: Set<(queue: QueuedAction[]) => void> = new Set()

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadQueue()
      window.addEventListener('online', () => this.processQueue())
    }
  }

  private loadQueue() {
    const saved = localStorage.getItem('modvora-offline-queue')
    if (saved) {
      this.queue = JSON.parse(saved)
    }
  }

  private saveQueue() {
    localStorage.setItem('modvora-offline-queue', JSON.stringify(this.queue))
    this.listeners.forEach(listener => listener([...this.queue]))
  }

  subscribe(listener: (queue: QueuedAction[]) => void): () => void {
    this.listeners.add(listener)
    listener([...this.queue])
    return () => this.listeners.delete(listener)
  }

  add(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>) {
    const item: QueuedAction = {
      ...action,
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retryCount: 0
    }
    this.queue.push(item)
    this.saveQueue()
    
    if (navigator.onLine) {
      this.processQueue()
    }
  }

  remove(id: string) {
    this.queue = this.queue.filter(item => item.id !== id)
    this.saveQueue()
  }

  async processQueue() {
    if (this.isProcessing || !navigator.onLine || this.queue.length === 0) return
    
    this.isProcessing = true
    
    while (this.queue.length > 0) {
      const action = this.queue[0]
      
      try {
        await this.executeAction(action)
        this.queue.shift()
        this.saveQueue()
      } catch (error) {
        action.retryCount++
        
        if (action.retryCount >= 3) {
          // Move to failed state
          this.queue.shift()
          this.saveQueue()
          // Could notify user of failed action
        } else {
          // Try again later
          break
        }
      }
    }
    
    this.isProcessing = false
  }

  private async executeAction(action: QueuedAction) {
    switch (action.type) {
      case 'like':
        await supabase.from('likes').insert(action.data)
        break
      case 'comment':
        await supabase.from('comments').insert(action.data)
        break
      case 'follow':
        await supabase.from('follows').insert(action.data)
        break
      case 'save':
        await supabase.from('saves').insert(action.data)
        break
      // 'post' handled separately (media uploads)
    }
  }

  getQueue(): QueuedAction[] {
    return [...this.queue]
  }

  getPendingCount(): number {
    return this.queue.length
  }
}

export const offlineQueue = new OfflineQueue()

// ===== PREFETCHING =====
class PrefetchManager {
  private prefetchQueue: Set<string> = new Set()
  private isPrefetching = false

  async prefetchPosts(postIds: string[]) {
    postIds.forEach(id => this.prefetchQueue.add(id))
    if (!this.isPrefetching) {
      this.processPrefetch()
    }
  }

  async prefetchImages(urls: string[]) {
    if (typeof window === 'undefined') return
    
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.as = 'image'
    
    urls.forEach(url => {
      const imgLink = link.cloneNode() as HTMLLinkElement
      imgLink.href = url
      document.head.appendChild(imgLink)
    })
  }

  private async processPrefetch() {
    this.isPrefetching = true
    
    while (this.prefetchQueue.size > 0) {
      const id = this.prefetchQueue.values().next().value
      this.prefetchQueue.delete(id)
      
      try {
        await cachedFetch(
          `post:${id}`,
          async () => {
            const { data } = await supabase
              .from('community_posts')
              .select('*')
              .eq('id', id)
              .single()
            return data
          },
          'posts'
        )
      } catch (error) {
        console.error('Prefetch failed:', error)
      }
      
      // Don't overwhelm the browser
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    this.isPrefetching = false
  }
}

export const prefetchManager = new PrefetchManager()

// ===== CONNECTION QUALITY =====
export type ConnectionQuality = 'excellent' | 'good' | 'slow' | 'poor' | 'offline'

export function getConnectionQuality(): ConnectionQuality {
  if (typeof navigator === 'undefined') return 'good'
  if (!navigator.onLine) return 'offline'
  
  const connection = (navigator as any).connection
  if (!connection) return 'good'
  
  const effectiveType = connection.effectiveType
  
  switch (effectiveType) {
    case '4g':
      return 'excellent'
    case '3g':
      return 'good'
    case '2g':
      return 'slow'
    case 'slow-2g':
      return 'poor'
    default:
      return 'good'
  }
}

export function shouldPrefetch(): boolean {
  const quality = getConnectionQuality()
  return quality === 'excellent' || quality === 'good'
}

export function shouldLoadHighRes(): boolean {
  const quality = getConnectionQuality()
  return quality === 'excellent' || quality === 'good'
}

// ===== OFFLINE INDICATOR =====
export function setupOfflineIndicator(
  onStatusChange: (status: { online: boolean; quality: ConnectionQuality }) => void
): () => void {
  if (typeof window === 'undefined') return () => {}
  
  const handler = () => {
    onStatusChange({
      online: navigator.onLine,
      quality: getConnectionQuality()
    })
  }
  
  window.addEventListener('online', handler)
  window.addEventListener('offline', handler)
  
  const connection = (navigator as any).connection
  if (connection) {
    connection.addEventListener('change', handler)
  }
  
  // Initial status
  handler()
  
  return () => {
    window.removeEventListener('online', handler)
    window.removeEventListener('offline', handler)
    if (connection) {
      connection.removeEventListener('change', handler)
    }
  }
}
