import { IntakeData } from './types'

export const LEGACY_INTAKE_KEY = 'modvora_intake'
export const VEHICLES_KEY = 'modvora_vehicles'
export const ACTIVE_VEHICLE_KEY = 'modvora_active_vehicle_id'
export const CHECKED_PARTS_KEY = 'modvora_checked_parts_by_vehicle'
export const PRODUCT_SELECTIONS_KEY = 'modvora_product_selections_by_vehicle'
export const BUILD_TRACKER_KEY = 'modvora_build_tracker_by_vehicle'
export const BUILD_MILESTONES_KEY = 'modvora_build_milestones_by_vehicle'
export const BUILD_PHOTOS_KEY = 'modvora_build_photos_by_vehicle'

export interface SavedVehicle extends IntakeData {
  id: string
  createdAt: string
  updatedAt: string
}

export type BuildItemStatus = 'planned' | 'purchased' | 'installed'

export interface BuildTrackerItem {
  partId: string
  productId?: string
  status: BuildItemStatus
  cost?: number
  vendor?: string
  notes?: string
  updatedAt: string
}

export interface BuildMilestone {
  id: string
  title: string
  done: boolean
  createdAt: string
  updatedAt: string
}

export interface BuildPhotoLog {
  id: string
  caption: string
  imageUrl: string
  createdAt: string
}

function createVehicleId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `vehicle_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function getVehicleLabel(vehicle: Pick<SavedVehicle, 'year' | 'make' | 'model' | 'trim'>) {
  return [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ')
}

export function normalizeVehicle(data: IntakeData, existingId?: string): SavedVehicle {
  const now = new Date().toISOString()

  return {
    ...data,
    id: existingId ?? createVehicleId(),
    createdAt: now,
    updatedAt: now,
  }
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function loadVehicles(): SavedVehicle[] {
  const stored = readJson<SavedVehicle[]>(VEHICLES_KEY, [])
  if (stored.length) return stored

  const legacy = readJson<IntakeData | null>(LEGACY_INTAKE_KEY, null)
  if (!legacy) return []

  const migrated = [normalizeVehicle(legacy)]
  saveVehicles(migrated)
  localStorage.setItem(ACTIVE_VEHICLE_KEY, migrated[0].id)
  localStorage.setItem(LEGACY_INTAKE_KEY, JSON.stringify(migrated[0]))
  return migrated
}

export function saveVehicles(vehicles: SavedVehicle[]) {
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles))
}

export function getActiveVehicleId() {
  return typeof window === 'undefined' ? null : localStorage.getItem(ACTIVE_VEHICLE_KEY)
}

export function setActiveVehicleId(vehicleId: string) {
  localStorage.setItem(ACTIVE_VEHICLE_KEY, vehicleId)
}

export function getActiveVehicle(): SavedVehicle | null {
  const vehicles = loadVehicles()
  if (!vehicles.length) return null

  const activeId = getActiveVehicleId()
  const activeVehicle = vehicles.find((vehicle) => vehicle.id === activeId) ?? vehicles[0]

  setActiveVehicleId(activeVehicle.id)
  localStorage.setItem(LEGACY_INTAKE_KEY, JSON.stringify(activeVehicle))

  return activeVehicle
}

export function saveVehicle(data: IntakeData, vehicleId?: string) {
  const vehicles = loadVehicles()
  const existing = vehicleId ? vehicles.find((vehicle) => vehicle.id === vehicleId) : undefined
  const nextVehicle: SavedVehicle = {
    ...normalizeVehicle(data, vehicleId ?? existing?.id),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const nextVehicles = existing
    ? vehicles.map((vehicle) => (vehicle.id === nextVehicle.id ? nextVehicle : vehicle))
    : [nextVehicle, ...vehicles]

  saveVehicles(nextVehicles)
  setActiveVehicleId(nextVehicle.id)
  localStorage.setItem(LEGACY_INTAKE_KEY, JSON.stringify(nextVehicle))

  return nextVehicle
}

export function deleteVehicle(vehicleId: string) {
  const vehicles = loadVehicles().filter((vehicle) => vehicle.id !== vehicleId)
  saveVehicles(vehicles)

  const nextActive = vehicles[0] ?? null

  if (nextActive) {
    setActiveVehicleId(nextActive.id)
    localStorage.setItem(LEGACY_INTAKE_KEY, JSON.stringify(nextActive))
  } else {
    localStorage.removeItem(ACTIVE_VEHICLE_KEY)
    localStorage.removeItem(LEGACY_INTAKE_KEY)
  }

  return vehicles
}

export function loadCheckedParts(vehicleId: string): string[] {
  const byVehicle = readJson<Record<string, string[]>>(CHECKED_PARTS_KEY, {})
  return byVehicle[vehicleId] ?? []
}

export function saveCheckedParts(vehicleId: string, partIds: string[]) {
  const byVehicle = readJson<Record<string, string[]>>(CHECKED_PARTS_KEY, {})
  byVehicle[vehicleId] = partIds
  localStorage.setItem(CHECKED_PARTS_KEY, JSON.stringify(byVehicle))
}

export function loadProductSelections(vehicleId: string): Record<string, string> {
  const byVehicle = readJson<Record<string, Record<string, string>>>(PRODUCT_SELECTIONS_KEY, {})
  return byVehicle[vehicleId] ?? {}
}

export function saveProductSelection(vehicleId: string, partId: string, productId: string | null) {
  const byVehicle = readJson<Record<string, Record<string, string>>>(PRODUCT_SELECTIONS_KEY, {})
  const current = byVehicle[vehicleId] ?? {}

  if (productId) current[partId] = productId
  else delete current[partId]

  byVehicle[vehicleId] = current
  localStorage.setItem(PRODUCT_SELECTIONS_KEY, JSON.stringify(byVehicle))
}

export function loadBuildTracker(vehicleId: string): Record<string, BuildTrackerItem> {
  const byVehicle = readJson<Record<string, Record<string, BuildTrackerItem>>>(BUILD_TRACKER_KEY, {})
  return byVehicle[vehicleId] ?? {}
}

export function saveBuildTrackerItem(vehicleId: string, item: BuildTrackerItem) {
  const byVehicle = readJson<Record<string, Record<string, BuildTrackerItem>>>(BUILD_TRACKER_KEY, {})
  const current = byVehicle[vehicleId] ?? {}
  current[item.partId] = {
    ...item,
    updatedAt: new Date().toISOString(),
  }
  byVehicle[vehicleId] = current
  localStorage.setItem(BUILD_TRACKER_KEY, JSON.stringify(byVehicle))
}

export function removeBuildTrackerItem(vehicleId: string, partId: string) {
  const byVehicle = readJson<Record<string, Record<string, BuildTrackerItem>>>(BUILD_TRACKER_KEY, {})
  const current = byVehicle[vehicleId] ?? {}
  delete current[partId]
  byVehicle[vehicleId] = current
  localStorage.setItem(BUILD_TRACKER_KEY, JSON.stringify(byVehicle))
}

export function getBuildTrackerSummary(vehicleId: string) {
  const items = Object.values(loadBuildTracker(vehicleId))
  const spend = items.reduce((sum, item) => sum + (item.cost ?? 0), 0)
  const planned = items.filter((item) => item.status === 'planned').length
  const purchased = items.filter((item) => item.status === 'purchased').length
  const installed = items.filter((item) => item.status === 'installed').length

  return {
    spend,
    planned,
    purchased,
    installed,
    totalTracked: items.length,
  }
}

export function loadBuildMilestones(vehicleId: string): BuildMilestone[] {
  const byVehicle = readJson<Record<string, BuildMilestone[]>>(BUILD_MILESTONES_KEY, {})
  return byVehicle[vehicleId] ?? []
}

export function saveBuildMilestones(vehicleId: string, milestones: BuildMilestone[]) {
  const byVehicle = readJson<Record<string, BuildMilestone[]>>(BUILD_MILESTONES_KEY, {})
  byVehicle[vehicleId] = milestones
  localStorage.setItem(BUILD_MILESTONES_KEY, JSON.stringify(byVehicle))
}

export function loadBuildPhotos(vehicleId: string): BuildPhotoLog[] {
  const byVehicle = readJson<Record<string, BuildPhotoLog[]>>(BUILD_PHOTOS_KEY, {})
  return byVehicle[vehicleId] ?? []
}

export function addBuildPhoto(vehicleId: string, input: { caption: string; imageUrl: string }) {
  const byVehicle = readJson<Record<string, BuildPhotoLog[]>>(BUILD_PHOTOS_KEY, {})
  const list = byVehicle[vehicleId] ?? []
  const next: BuildPhotoLog = {
    id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    caption: input.caption.trim(),
    imageUrl: input.imageUrl.trim(),
    createdAt: new Date().toISOString(),
  }
  byVehicle[vehicleId] = [next, ...list]
  localStorage.setItem(BUILD_PHOTOS_KEY, JSON.stringify(byVehicle))
  return next
}
