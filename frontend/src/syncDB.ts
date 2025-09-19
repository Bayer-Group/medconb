import {inferSchema, initParser, Parser, Schema} from 'udsv'
import {LocalCode, LocalOntology} from '..'
import {db} from './db'
import {DBSyncProgress} from './syncTypes'
import {getTimer} from './utils/timer'
import localforage from 'localforage'

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
  timer.logStep('Retrieved manifest')

  let storedCounts: Record<string, number> = ((await localforage.getItem('syncDB_insertedCounts')) as any)?.counts ?? {}
  timer.logStep('Retrieved stored counts from localforage')

  // TODO: Implement a background check of the database and inform the app via the store about changes, so a clear and reload can happen.

  // Check which ontologies need to be reloaded
  const countChecks = await Promise.all(
    manifest.files.map(async (entry) => {
      const currentCount = storedCounts[entry.ontology_id] ?? -1
      return {
        entry,
        currentCount,
        isCorrect: entry.num_codes === currentCount,
      }
    }),
  )
  timer.logStep('Retrieved code counts from localforage')

  let entriesToSync = countChecks.filter((check) => !check.isCorrect).map((check) => check.entry)

  if (entriesToSync.length === 0) {
    timer.logStep('No entries to sync')
    return
  }

  timer.logStep(`Start clearing outdated ontology data`)

  await Promise.all([
    db.codes.clear(),
    db.ontologies.clear(),
    // db.codes.where('ontology_id').anyOf(ontologyIds).delete(),
    // db..where('name').anyOf(ontologyIds).delete(),
  ])

  timer.logStep(`Cleared outdated ontology data`)

  entriesToSync = countChecks.map((check) => check.entry)

  // Initialize progress tracking for all ontologies (including ones that are already correct)
  const progressMap = new Map<string, [number, number]>()
  manifest.files.forEach((entry) => {
    const isAlreadyCorrect = countChecks.find((check) => check.entry.ontology_id === entry.ontology_id)?.isCorrect
    if (isAlreadyCorrect) {
      // Mark as completed
      progressMap.set(entry.ontology_id, [entry.num_codes, entry.num_codes])
    } else {
      // Initialize for loading
      progressMap.set(entry.ontology_id, [0, entry.num_codes])
    }
  })

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

  // Store the inserted counts in localforage
  try {
    await localforage.setItem('syncDB_insertedCounts', {
      timestamp: new Date().toISOString(),
      counts: insertedCounts,
      totalOntologies: entriesToSync.length,
    })
    timer.logStep('Stored inserted counts in localforage')
  } catch (error) {
    console.error('Failed to store inserted counts in localforage:', error)
  }

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
