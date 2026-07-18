import fs from 'node:fs'
import path from 'node:path'

export type ScannedFile = {
  relativePath: string
  absolutePath: string
  content: string
  lineCount: number
}

const SCAN_ROOTS = ['app', 'components', 'lib']
const EXCLUDED_DIRS = new Set(['node_modules', '.next', '.git', '.vyron-dev'])
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx'])

function walk(dir: string, root: string, out: string[]): void {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, root, out)
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      out.push(path.relative(root, full).split(path.sep).join('/'))
    }
  }
}

/**
 * A single-pass, read-only scan of this repo's own source tree (app/,
 * components/, lib/ — the code VYRON DEV can meaningfully reason about,
 * not the entire project's every file). Every Code/Documentation/Quality
 * Intelligence detector that needs file contents shares this one walk
 * instead of re-walking the tree per detector.
 */
export function scanRepositoryFiles(): ScannedFile[] {
  const root = process.cwd()
  const relativePaths: string[] = []
  for (const dir of SCAN_ROOTS) {
    walk(path.join(root, dir), root, relativePaths)
  }

  const files: ScannedFile[] = []
  for (const relativePath of relativePaths) {
    const absolutePath = path.join(root, relativePath)
    try {
      const content = fs.readFileSync(absolutePath, 'utf-8')
      files.push({ relativePath, absolutePath, content, lineCount: content.split('\n').length })
    } catch {
      // unreadable file — skip rather than fail the whole scan
    }
  }
  return files
}
