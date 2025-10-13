import {inferSchema, initParser, Parser, Schema} from 'udsv'
import {LocalCode, LocalOntology} from '..'
import {db} from './db'
import {DBSyncProgress} from './syncTypes'
import {getTimer} from './utils/timer'

type ManifestEntry = {
  num_codes: number
  name: string
  ontology_id: string
  is_linear: boolean
}
type Manifest = {
  files: ManifestEntry[]
}
type syncDBOptions = {
  baseUrl: string
  tokenLookup: () => Promise<string>
  onProgress: (progress: DBSyncProgress) => void
}
const syncDB = async ({baseUrl, tokenLookup, onProgress}: syncDBOptions) => {
  const timer = getTimer('App').createSubTimer('syncDB')

  const token = await tokenLookup()
  timer.logStep('Retrieved auth token')

  const manifestReq = await fetch(`${baseUrl}assets/manifest.json`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const manifest: Manifest = (await manifestReq.json()) as Manifest
  const manifestTotal = manifest.files.reduce((acc, entry) => entry.num_codes + acc, 0)
  timer.logStep('Retrieved manifest')

  const totalCount = await db.codes.count()
  timer.logStep(`Retrieved total code count (${totalCount})`)

  if (totalCount === manifestTotal) {
    timer.logStep('No entries to sync')
    return
  }

  timer.logStep(`Start clearing outdated ontology data`)

  await db.delete({disableAutoOpen: false})

  timer.logStep(`Cleared outdated ontology data`)

  let entriesToSync = manifest.files

  // Initialize progress tracking for all ontologies (including ones that are already correct)
  const progressMap = new Map<string, [number, number]>()
  manifest.files.forEach((entry) => progressMap.set(entry.ontology_id, [0, entry.num_codes]))

  const emitProgress = () => {
    const progressArray: DBSyncProgress = manifest.files.map((entry) => ({
      name: entry.ontology_id,
      countTotal: progressMap.get(entry.ontology_id)![1],
      countLoaded: progressMap.get(entry.ontology_id)![0],
    }))
    onProgress(progressArray)
  }

  emitProgress() // Initial state

  const insertedCounts: Record<string, number> = {}

  const _syncResults = entriesToSync.map(async (entry) => {
    const req = await fetch(`${baseUrl}assets/${entry.name}`, {
      headers: {Authorization: `Bearer ${token}`},
    })

    const blob = await req.blob()
    const stream = blob.stream()?.pipeThrough(new DecompressionStream('gzip'))
    const textStream = stream.pipeThrough(new TextDecoderStream())

    const [countStream, processStream] = textStream.tee()

    let cnt = 0
    const csvStreamCount = countStream.pipeThrough<LocalCode[]>(new CSVTransformStream())
    for await (const strChunk of csvStreamCount) {
      cnt += strChunk.length
    }

    if (cnt !== entry.num_codes) return false

    // build ontology
    const ontology: Partial<LocalOntology> = {}
    ontology.root_code_ids = []
    ontology.is_linear = entry.is_linear
    const csvStream = processStream.pipeThrough<LocalCode[]>(new CSVTransformStream(true))

    let cx = 0
    for await (const x of csvStream) {
      if (!ontology.name) {
        ontology.name = x[0].ontology_id
      }
      if (!ontology.is_linear) {
        ontology.root_code_ids.push(...x.filter((c) => c.path.length === 1).map((c) => c.id))
      }
      cx += x.length

      // Update progress for this specific ontology
      progressMap.set(entry.ontology_id, [cx, entry.num_codes])
      emitProgress()

      await db.codes.bulkPut(x)
    }

    await db.ontologies.put(ontology as LocalOntology)

    console.log('inserted: ', cx, 'actual:', cnt)

    insertedCounts[entry.ontology_id] = cx

    return true
  })

  const syncResults = await Promise.all(_syncResults)

  const allSyncCorrect = syncResults.every(Boolean)
  if (!allSyncCorrect) throw new DBSyncError('SYNC_DB_MISMATCH')
  timer.logStep('All ontologies were successfully synced')

  // Final progress update - all ontologies at 100%
  entriesToSync.forEach((entry) => {
    progressMap.set(entry.ontology_id, [entry.num_codes, entry.num_codes])
  })
  emitProgress()
}

export default syncDB

export class DBSyncError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DBSyncError'
    Object.setPrototypeOf(this, DBSyncError.prototype)
  }
}

class CSVTransformStream extends TransformStream {
  private parser?: Parser
  private schema?: Schema

  constructor(typeDeep = false) {
    super({
      transform: (chunk, controller) => {
        if (this.parser === undefined) {
          this.schema = inferSchema(chunk as string)
          this.schema.cols.find((c) => c.name === 'code')!.type = 's'
          this.parser = initParser(this.schema)
        }

        return new Promise((resolve) => {
          this.parser?.chunk(chunk, typeDeep ? this.parser.typedDeep : this.parser.stringArrs, (parsed) => {
            controller.enqueue(parsed)
          })

          resolve()
        })
      },
      flush: () => {
        this.parser?.end()
      },
    })
  }
}
