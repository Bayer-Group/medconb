import Dexie, {EntityTable} from 'dexie'
import {LocalCode, LocalOntology} from '..'

const db = new Dexie('myDatabase') as Dexie & {
  codes: EntityTable<LocalCode, 'id'>
  ontologies: EntityTable<LocalOntology, 'name'>
}

db.version(1).stores({
  codes: '&id, ontology_id',
  ontologies: '&name',
})

export {db}
