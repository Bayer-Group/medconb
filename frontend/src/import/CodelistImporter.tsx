import Icon from '@ant-design/icons'
import {useApolloClient} from '@apollo/client'
import {Modal, Segmented} from 'antd'
import {useLiveQuery} from 'dexie-react-hooks'
import React, {useContext, useState} from 'react'
import {ImportCodelistPayload, LocalOntology} from '../..'
import ErrorHandlerContext from '../ErrorHandlerContext'
import {CloseIcon} from '../customIcons'
import {IMPORT_CODE_LIST, SELF} from '../graphql'
import {Title} from '../scratch'
import {ImportColumnMap} from './ColumnMapper'
import ImportFromFile from './ImportFromFile'
import ImportFromText from './ImportFromText'
import {db} from '../db'

const tryMap = (headers: string[]): ImportColumnMap => {
  if (headers.length == 2) {
    // single MC import
    return {
      ontology: 1,
      code: 0,
      concept: '',
    }
  } else {
    //if(headers.length == 4)
    // multi MC import
    return {
      concept: 0,
      code: 2,
      ontology: 3,
    }
  }
}

type CodeListImporterProps = {
  onCancel: () => void
  onClose: () => void
  collection: {
    id: string
    name: string
  }
}

const CodelistImporter: React.FC<CodeListImporterProps> = ({onCancel, onClose, collection}) => {
  const [importMethod, setImportMethod] = useState('file')
  const client = useApolloClient()
  const {onError} = useContext(ErrorHandlerContext)

  const doImport = async (input: ImportCodelistPayload) => {
    try {
      const res = await client.mutate({
        mutation: IMPORT_CODE_LIST,
        variables: input,
        refetchQueries: [
          {
            query: SELF,
          },
        ],
      })

      return res.data
    } catch (error) {
      onError(error as Error)
    } finally {
    }
  }

  const ontologies = useLiveQuery(() => db.ontologies.toArray())
  const validOntologies = ontologies?.map((o: LocalOntology) => o.name)

  return (
    <Modal width={750} open footer={false} onCancel={onCancel} closeIcon={<Icon component={() => <CloseIcon />} />}>
      <Title style={{marginBottom: 20}}>{`Import to collection "${collection.name}"`}</Title>
      <div style={{textAlign: 'center', marginBottom: 30}}>
        {/* @ts-ignore:next-line */}
        <Segmented
          size="small"
          value={importMethod}
          onChange={(value) => setImportMethod(value as string)}
          options={[
            {value: 'file', label: 'Import from file'},
            {value: 'text', label: 'Import from text'},
          ]}
        />
      </div>
      {importMethod === 'file' && (
        <ImportFromFile
          onImport={doImport}
          validOntologies={validOntologies ?? []}
          onClose={onClose}
          collection={collection}
        />
      )}
      {importMethod === 'text' && (
        <ImportFromText
          onImport={doImport}
          validOntologies={validOntologies ?? []}
          onClose={onClose}
          collection={collection}
        />
      )}
    </Modal>
  )
}

export default CodelistImporter
