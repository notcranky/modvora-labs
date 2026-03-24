import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'

const targets = ['.next', '.next-dev.log', '.next-dev.err.log']

for (const target of targets) {
  const fullPath = path.resolve(process.cwd(), target)

  if (!existsSync(fullPath)) {
    console.log(`[clean-next] skip ${target} (not found)`)
    continue
  }

  try {
    rmSync(fullPath, { recursive: true, force: true })
    console.log(`[clean-next] removed ${target}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[clean-next] could not remove ${target}: ${message}`)
  }
}
