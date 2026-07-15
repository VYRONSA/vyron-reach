import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { getSupabaseUserId } from '@/lib/vyronStore/supabaseSync'
import { newId } from '@/lib/vyronStore/storage'

export const MARKETING_CREATIVES_BUCKET = 'marketing-creatives'

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_BYTES = 8 * 1024 * 1024

export function isAcceptedCreativeFile(file: File): boolean {
  return ACCEPTED_TYPES.includes(file.type) && file.size <= MAX_BYTES
}

function extFromFile(file: File): string {
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export type UploadCreativeImageResult = {
  imageUrl: string
  storagePath?: string
  usedSupabase: boolean
}

export async function uploadCreativeImage(
  file: File,
  clientId: string,
): Promise<UploadCreativeImageResult> {
  if (!isAcceptedCreativeFile(file)) {
    throw new Error('Use PNG, JPG, or WebP under 8MB')
  }

  const assetId = newId('asset')
  const ext = extFromFile(file)

  if (isSupabaseConfigured) {
    const userId = await getSupabaseUserId()
    const owner = userId ?? 'owner'
    const storagePath = `${owner}/${clientId}/${assetId}.${ext}`

    const { error } = await supabase.storage.from(MARKETING_CREATIVES_BUCKET).upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

    if (!error) {
      const { data } = supabase.storage.from(MARKETING_CREATIVES_BUCKET).getPublicUrl(storagePath)
      console.log('[creative-upload] Supabase success', storagePath)
      return { imageUrl: data.publicUrl, storagePath, usedSupabase: true }
    }

    console.error('[creative-upload] Supabase upload failed, using local fallback', error.message)
  }

  const imageUrl = await fileToDataUrl(file)
  return { imageUrl, usedSupabase: false }
}
