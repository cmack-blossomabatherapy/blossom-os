import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = Deno.env.get('SUPABASE_URL')!
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(url, key)

  const buckets = ['resource-library', 'knowledge-documents']
  const report: Record<string, { deleted: number; errors: string[] }> = {}

  async function purge(bucket: string, prefix = ''): Promise<{ deleted: number; errors: string[] }> {
    let deleted = 0
    const errors: string[] = []
    // Recursively walk folders
    let offset = 0
    const pageSize = 1000
    // Collect all file paths under this prefix
    const filePaths: string[] = []
    const subFolders: string[] = []
    while (true) {
      const { data, error } = await supabase.storage.from(bucket).list(prefix, {
        limit: pageSize,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      })
      if (error) { errors.push(`${prefix}: ${error.message}`); break }
      if (!data || data.length === 0) break
      for (const item of data) {
        const path = prefix ? `${prefix}/${item.name}` : item.name
        // Folder entries have null id / no metadata
        if (item.id === null || !item.metadata) subFolders.push(path)
        else filePaths.push(path)
      }
      if (data.length < pageSize) break
      offset += pageSize
    }
    // Delete files in this folder in batches
    for (let i = 0; i < filePaths.length; i += 500) {
      const batch = filePaths.slice(i, i + 500)
      const { error } = await supabase.storage.from(bucket).remove(batch)
      if (error) errors.push(error.message)
      else deleted += batch.length
    }
    // Recurse
    for (const sub of subFolders) {
      const r = await purge(bucket, sub)
      deleted += r.deleted
      errors.push(...r.errors)
    }
    return { deleted, errors }
  }

  for (const b of buckets) {
    try {
      report[b] = await purge(b)
    } catch (e) {
      report[b] = { deleted: 0, errors: [(e as Error).message] }
    }
  }

  return new Response(JSON.stringify(report, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})