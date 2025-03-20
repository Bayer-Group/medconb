import React, { useContext, useMemo, useState} from 'react'
import {Tabs, Input, Button, Space, Select, TabsProps} from 'antd'
import {difference, isString, keys, omit, values} from 'lodash'
import {styled} from '@linaria/react'
import {useApolloClient} from '@apollo/client'
import ErrorHandlerContext from '../ErrorHandlerContext'
import {ImportConceptPayload} from '../..'

const {TextArea} = Input

type ImportFromTextProps = {
  onClose: () => void
  onImport: (input: ImportConceptPayload) => Promise<any>
  collection: {
    id: string
    name: string
  }
  validOntologies: string[]
}

type InputData = {[key: string]: string}
enum Delimiter {
  NEW_LINE = 'New Line',
  COMMA = 'Comma',
  OTHERS = 'Other',
}

const knownCharMap = {
  [Delimiter.COMMA]: ',',
  [Delimiter.NEW_LINE]: '\n',
}

const ImportFromText: React.FC<ImportFromTextProps> = ({onClose, onImport, collection, validOntologies}) => {
  const client = useApolloClient()
  const [response, setResponse] = useState<any>(null)
  const [working, setWorking] = useState(false)
  const {onError} = useContext(ErrorHandlerContext)
  const [data, setData] = useState<InputData>({})
  const [selectedOntologies, setSelectedOntologies] = useState<string[]>([])
  const [name, setName] = useState<string>('')
  const [delimiter, setDelimiter] = useState<Delimiter>(Delimiter.NEW_LINE)
  const [delimiterChar, setDelimiterChar] = useState<string | null>(null)

  const tabs = useMemo(() => {
    return keys(data).map((ontology) => ({
      label: ontology,
      key: ontology,
      closable: true,
      children: (
        <>
          <TextArea value={data[ontology]} onChange={(e) => setData({...data, [ontology]: e.target.value})} rows={6} />
        </>
      ),
    }))
  }, [data])
  const remainingOntologies = difference(validOntologies, keys(data)).map((o) => ({value: o, label: o}))
  const onEdit: TabsProps['onEdit'] = (targetKey, action: 'add' | 'remove') => {
    if (isString(targetKey)) {
      if (action === 'remove') {
        setData(omit(data, targetKey))
      }
    }
  }

  const doImport = async () => {
    setWorking(true)
    const input = {
      containerID: collection.id,
      codelists: [
        {
          name,
          codesets: keys(data).map((o) => ({
            ontologyID: o,
            codes: data[o].split(delimiter === Delimiter.OTHERS ? delimiterChar! : knownCharMap[delimiter]),
          })),
        },
      ],
      filename: 'Import-from-text',
    } as ImportConceptPayload

    const res = await onImport(input)
    if (res) {
      setResponse(res)
    }
    setWorking(false)
  }
  const hasData = keys(data).length > 0
  const isValid = !!name && hasData && (delimiter !== Delimiter.OTHERS || !!delimiterChar)
  return (
    <>
      {remainingOntologies.length > 0 && (
        <>
          <p>Select the ontologies from which you want to add codes to this codelist</p>
          <div>
            <Space style={{marginBottom: 20}}>
              <Select
                mode="multiple"
                value={selectedOntologies}
                size="small"
                allowClear
                style={{width: 300}}
                onChange={(v) => setSelectedOntologies(v)}
                options={remainingOntologies}
              />
              <Button
                size="small"
                onClick={() => {
                  if (selectedOntologies) {
                    setData({
                      ...data,
                      ...selectedOntologies.reduce((a, c) => {
                        a[c] = ''
                        return a
                      }, {} as InputData),
                    })
                    setSelectedOntologies([])
                  }
                }}>
                Add
              </Button>
            </Space>
          </div>
        </>
      )}

      <Tabs
        defaultActiveKey="1"
        type="editable-card"
        size="small"
        hideAdd
        items={tabs}
        onEdit={onEdit}
        style={{marginBottom: 20}}
      />
      {hasData && (
        <>
          <Mapper>
            <div key="name">Name of codelist</div>
            <Input type="text" size="small" value={name ?? ''} onChange={(e) => setName(e.target.value)} />
            <div key="delimiter">Codes are seperated by</div>
            <Select
              value={delimiter}
              size="small"
              style={{width: 300}}
              onChange={(v) => setDelimiter(v)}
              options={values(Delimiter).map((v) => ({label: v, value: v}))}
            />
            {delimiter === Delimiter.OTHERS && (
              <>
                <div key="delimiterChar">Enter the separator</div>
                <Input
                  type="text"
                  size="small"
                  style={{width: 50}}
                  maxLength={1}
                  value={delimiterChar ?? ''}
                  onChange={(e) => setDelimiterChar(e.target.value)}
                />
              </>
            )}
          </Mapper>
          {response && (
            <>
              {(response.importCodelists.reports ?? []).map((report: any) => (
                <div key={report.codelistName}>
                  <p>{report.codelistName}</p>
                  <p>{report.report}</p>
                </div>
              ))}

              {/* {JSON.stringify(response)} */}
              <div style={{textAlign: 'right'}}>
                <Space>
                  <Button onClick={onClose} type="primary" size="small">
                    Close
                  </Button>
                </Space>
              </div>
            </>
          )}
          {!response && (
            <div style={{textAlign: 'right'}}>
              <Space>
                <Button disabled={!isValid} loading={working} type="primary" size="small" onClick={() => doImport()}>
                  Proceed
                </Button>
              </Space>
            </div>
          )}
        </>
      )}
    </>
  )
}

export default ImportFromText

export const Mapper = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: repeat(3, 1.5rem);
  grid-column-gap: 0px;
  grid-row-gap: 4px;
  align-items: center;
  margin-bottom: 6px;
`
