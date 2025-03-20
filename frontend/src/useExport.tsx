import {useApolloClient, useLazyQuery} from '@apollo/client'
import {CodeSet} from '..'
import {FETCH_CODE_LIST} from './graphql'
import {saveAs} from 'file-saver'
import * as XLSX from 'xlsx'
import useChangeSet from './useChangeSet'
import {chunk, difference, find, flattenDeep, isNil, keys, union, uniq} from 'lodash'
import {db} from './db'

const useExport = () => {
  const changeSet = useChangeSet()
  const [loadCodelist] = useLazyQuery(FETCH_CODE_LIST)
  return {
    async export(filename: string, mcsToExport: string[]) {
      const rows = [['Medical Codelist', 'Ontology', 'Code', 'Description']]
      for (let i = 0; i < mcsToExport.length; i++) {
        const res = await loadCodelist({
          variables: {codelistID: mcsToExport[i]},
        })

        let ontologies = res.data.codelist.codesets.map((cs: CodeSet) => cs.ontology.name)
        ontologies = union(ontologies, keys(changeSet[mcsToExport[i]] ?? {}))

        for (let o = 0; o < ontologies.length; o++) {
          const ontology = ontologies[o]

          const allCodes = await db.codes.where({ontology_id: ontology}).toArray()

          const transientAdded = (changeSet[mcsToExport[i]] ?? {})[ontology]?.added ?? []
          const transientremoved = (changeSet[mcsToExport[i]] ?? {})[ontology]?.removed ?? []

          const cs: CodeSet = find(res.data.codelist.codesets, (_cs) => _cs.ontology.name === ontology)

          const reducedCodeset = isNil(cs) ? [] : cs.codes.map((c) => c.id)
          const codesWIthTransient = difference(union(reducedCodeset, transientAdded), transientremoved)

          for (let j = 0; j < codesWIthTransient.length; j++) {
            const code = find(allCodes, {id: Number(codesWIthTransient[j])}) //await db.codes.get()
            rows.push([`${res.data.codelist.name}`, `${ontology}`, `${code.code}`, `${code.description}`])
          }
        }
      }

      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.aoa_to_sheet(rows)

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet 1')
      const wopts = {bookType: 'xlsx' as XLSX.BookType, bookSST: false, type: 'array' as XLSX.WritingOptions['type']}
      const wbout = XLSX.write(workbook, wopts)

      const blob = new Blob([wbout], {type: 'application/octet-stream'})
      saveAs(blob, `${filename}.xlsx`)
    },
  }
}

export default useExport
