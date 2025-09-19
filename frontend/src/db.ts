import Dexie, {EntityTable} from 'dexie'
import {LocalCode, LocalOntology} from '..'

// old database (version)
Dexie.delete('myDatabase')

const db = new Dexie('ontologies') as Dexie & {
  codes: EntityTable<LocalCode, 'id'>
  ontologies: EntityTable<LocalOntology, 'name'>
}

db.version(1).stores({
  codes: '&id, *ontology_id',
  ontologies: '&name',
})

export {db}
