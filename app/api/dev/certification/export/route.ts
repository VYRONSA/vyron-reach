import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { listCertifiedFeatures } from '@/lib/dev/certification/certificationStore'
import { getProjectCertification, getPlatformCertification, generateEvidencePack } from '@/lib/dev/certification/certificationService'
import { exportFeaturesAsJson, exportFeaturesAsCsv, exportSummaryAsJson, exportSummaryAsCsv, toPdfReadyDocument } from '@/lib/dev/certification/certificationExportService'
import type { PlatformCertificationWindow } from '@/lib/dev/certification/certificationTypes'

const WINDOWS: PlatformCertificationWindow[] = ['30d', '90d', '12m']

/** "Support: JSON, CSV, PDF-ready structured output." `scope=features` (default) exports every Certified feature (optionally filtered by project); `scope=project` exports one project's summary; `scope=platform` exports a rolling window's summary; `scope=evidence&featureId=...` exports one feature's full Evidence Pack as a PDF-ready document (format is ignored for that scope — the PDF-ready shape IS the export). */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json' } })
  }

  const params = request.nextUrl.searchParams
  const format = params.get('format') === 'csv' ? 'csv' : 'json'
  const scope = params.get('scope') ?? 'features'

  if (scope === 'evidence') {
    const featureId = params.get('featureId')
    if (!featureId) return json({ error: 'featureId is required for scope=evidence' }, 400)
    const pack = generateEvidencePack(featureId)
    if (!pack) return json({ error: 'No evidence pack available' }, 404)
    return fileResponse(JSON.stringify(toPdfReadyDocument(pack), null, 2), 'json', `certification-evidence-${pack.batchId}`)
  }

  if (scope === 'project') {
    const project = params.get('project')
    if (!project) return json({ error: 'project is required for scope=project' }, 400)
    const summary = getProjectCertification(project)
    const body = format === 'csv' ? exportSummaryAsCsv(summary) : exportSummaryAsJson(summary)
    return fileResponse(body, format, `certification-project-${project}`)
  }

  if (scope === 'platform') {
    const window = (params.get('window') as PlatformCertificationWindow | null) ?? '30d'
    if (!WINDOWS.includes(window)) return json({ error: `window must be one of: ${WINDOWS.join(', ')}` }, 400)
    const summary = getPlatformCertification(window)
    const body = format === 'csv' ? exportSummaryAsCsv(summary) : exportSummaryAsJson(summary)
    return fileResponse(body, format, `certification-platform-${window}`)
  }

  const project = params.get('project') ?? undefined
  const features = listCertifiedFeatures(project)
  const body = format === 'csv' ? exportFeaturesAsCsv(features) : exportFeaturesAsJson(features)
  return fileResponse(body, format, 'certification-features')
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function fileResponse(body: string, format: 'json' | 'csv', filenameBase: string): Response {
  const contentType = format === 'csv' ? 'text/csv; charset=utf-8' : 'application/json'
  return new Response(body, { headers: { 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${filenameBase}.${format}"` } })
}
