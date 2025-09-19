export interface OntologyProgress {
  name: string
  countTotal: number
  countLoaded: number
}

export type DBSyncProgress = OntologyProgress[]
