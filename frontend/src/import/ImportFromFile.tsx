import React, {useCallback, useContext, useEffect, useState} from 'react'
import {Button, Select, Space, Steps, Upload} from 'antd'
import {InboxOutlined} from '@ant-design/icons'
const {Dragger} = Upload
import * as XLSX from 'xlsx'
import {isString, nth, uniq, findIndex, map} from 'lodash'
import ColumnMapper, {ColumnMapperSummary, ImportColumnMap, columnLables} from './ColumnMapper'
import OntologyMapper, {OntologyMap, OntologyMapperSummary} from './OntologyMapper'
import {useDispatch} from 'react-redux'
import {useApolloClient} from '@apollo/client'
import {ImportCodelistPayload} from '../..'
import ErrorHandlerContext from '../ErrorHandlerContext'
import InlineHelp from '../InlineHelp'
const {Option} = Select

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

type ImportFromFileProps = {
  onClose: () => void
  onImport: (input: ImportCodelistPayload) => Promise<any>
  collection: {
    id: string
    name: string
  }
  validOntologies: string[]
}

const steps = ['upload', 'sheet_select', 'map_columns', 'map_ontologies', 'finalize'] as const
type Step = typeof steps[number]

const ImportFromFile: React.FC<ImportFromFileProps> = ({onClose, onImport, collection, validOntologies}) => {
  const [file, setFile] = useState<File | null>(null)
  const [fileLoading, setFileLoading] = useState(false)
  const [columnMap, setColumnMap] = useState({} as ImportColumnMap)
  const [ontologyMap, setOntologyMap] = useState({} as OntologyMap)
  const [ontologies, setOntologies] = useState({} as any)
  const [step, setStep] = useState<Step>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<any[][]>([])
  const [response, setResponse] = useState<any>({})
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null)
  const [sheetName, setSheetName] = useState<string | null>(null)

  const handleFileSelected = async (file: File) => {
    try {
      setFileLoading(true)
      setFile(file)

      const fileData = await file.arrayBuffer()
      const workbook = XLSX.read(fileData, {type: 'array'})

      setWorkbook(workbook)
      if (workbook.SheetNames.length === 1) {
        handleSheetSelected(workbook, workbook.SheetNames[0])
      } else {
        setStep('sheet_select')
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleSheetSelected = (workbook: XLSX.WorkBook, sheetName: string) => {
    const sheet = workbook.Sheets[sheetName]

    const headers: string[] = []
    const rows: any[][] = []

    for (const key in sheet) {
      const cell = sheet[key]
      const address = XLSX.utils.decode_cell(key)

      if (address.r === 0) {
        if (isString(cell.v)) {
          headers[address.c] = cell.v
        }
        continue
      }

      if (isString(cell)) continue

      rows[address.r - 1] = rows[address.r - 1] ?? []
      rows[address.r - 1][address.c] = cell.w ?? cell.v
    }

    let initMappingResult = {} as ImportColumnMap
    for (let hId = 0; hId < headers.length; hId++) {
      if (!isString(headers[hId])) continue
      map(columnLables, (label, key) => {
        console.log(label, headers[hId])
        if (headers[hId].toLowerCase() === label.toLowerCase()) initMappingResult[key as keyof ImportColumnMap] = hId
      })
    }
    setColumnMap(initMappingResult)

    setSheetName(sheetName)
    setHeaders(headers)
    setRows(rows)
    setStep('map_columns')
  }

  const handleColumnMapChange = (map: ImportColumnMap) => {
    setColumnMap(map)

    // extract ontologies
    const ontologies = uniq(rows.map((row) => nth(row, map.ontology)))

    setOntologyMap(
      ontologies.reduce((a, o) => {
        if (validOntologies.includes(o)) {
          a[o] = o
        }
        return a
      }, {} as any),
    )
    // calculate map
    setOntologies(ontologies)
    setStep('map_ontologies')
  }

  const handleOntologyMapChange = async (map: OntologyMap) => {
    setOntologyMap(map)

    const input = rows.reduce(
      (a, row) => {
        const conceptName = isString(columnMap.concept) ? columnMap.concept : row[columnMap.concept]
        const code = row[columnMap.code]
        const ontology = map[row[columnMap.ontology]]

        if (ontology == 'skip') return a

        let mcIndex = findIndex(a.codelists, {name: conceptName})
        if (mcIndex < 0) {
          a.codelists.push({
            name: conceptName,
            codesets: [],
          })
        }

        mcIndex = findIndex(a.codelists, {name: conceptName})
        const codeset = findIndex(a.codelists[mcIndex].codesets, {ontologyID: ontology})
        if (codeset < 0) {
          a.codelists[mcIndex].codesets.push({
            ontologyID: ontology,
            codes: [String(code)],
          })
        } else {
          a.codelists[mcIndex].codesets[codeset].codes.push(String(code))
        }

        return a
      },
      {
        containerID: collection.id,
        codelists: [],
        filename: file?.name,
      } as ImportCodelistPayload,
    )

    const res = await onImport(input)
    if (res) {
      setResponse(res)
      setStep('finalize')
    }
  }

  const stepContents = {
    upload: (x: 'done' | 'active') =>
      x == 'done' ? (
        <p className="ant-upload-text">{file?.name}</p>
      ) : (
        <Dragger
          name="file"
          showUploadList={false}
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          multiple={false}
          disabled={fileLoading}
          customRequest={({file}) => handleFileSelected(file as File)}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          {!fileLoading ? (
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
          ) : (
            <p className="ant-upload-hint">Loading file {file?.name}...</p>
          )}
        </Dragger>
      ),
    sheet_select: (x: 'done' | 'active') =>
      x == 'done' ? (
        <p className="ant-upload-text">Sheet: {sheetName}</p>
      ) : (
        <Select
          size="small"
          key={'sheet'}
          style={{width: 300}}
          onChange={(sheet) => handleSheetSelected(workbook as XLSX.WorkBook, sheet)}>
          {workbook?.SheetNames.map((s, i) => (
            <Option key={s} value={s}>
              {s}
            </Option>
          ))}
        </Select>
      ),
    map_columns: (x: 'done' | 'active') =>
      x == 'done' ? (
        <ColumnMapperSummary headers={headers} columnMap={columnMap} />
      ) : (
        <ColumnMapper
          filename={file?.name ?? ''}
          onProceed={handleColumnMapChange}
          onBack={() => {
            if (workbook && workbook.SheetNames.length > 1) {
              setStep('sheet_select')
            } else {
              setFile(null)
              setStep('upload')
            }
          }}
          headers={headers}
          initColumnMap={columnMap}
        />
      ),
    map_ontologies: (x: 'done' | 'active') =>
      x == 'done' ? (
        <OntologyMapperSummary value={ontologyMap} />
      ) : (
        <OntologyMapper
          onProceed={handleOntologyMapChange}
          value={ontologyMap}
          validOntologies={validOntologies}
          ontologies={ontologies}
          onBack={() => {
            setStep('map_columns')
            setOntologyMap({})
          }}
        />
      ),
    finalize: (x: 'done' | 'active') =>
      x == 'done' ? (
        <></>
      ) : (
        <>
          {(response.importCodelists.reports ?? []).map((report: any) => (
            <div key={report.codelistName}>
              <p>{report.codelistName}</p>
              <p>{report.report}</p>
            </div>
          ))}

          <div style={{textAlign: 'right'}}>
            <Space>
              <Button onClick={onClose} type="primary" size="small">
                Close
              </Button>
            </Space>
          </div>
        </>
      ),
  }

  const stepId = steps.indexOf(step)
  const stepItems = map(Array(steps.length), (_, i) => {
    let description = <></>
    if (stepId === i) description = stepContents[steps[i]]('active')
    if (stepId > i) description = stepContents[steps[i]]('done')

    return {
      title: (
        <>
          {stepTitles[steps[i]]}
          <InlineHelp content={stepInlineHelp[steps[i]]} />
        </>
      ),
      description,
    }
  })

  return <Steps progressDot direction="vertical" size="small" current={stepId} items={stepItems} />
}

const stepTitles = {
  upload: 'Upload file',
  sheet_select: 'Select sheet to import',
  map_columns: 'Map column headers',
  map_ontologies: 'Map ontologies',
  finalize: 'Import summary',
}

const stepInlineHelp = {
  upload:
    'Please upload a .csv or a .xlsx file containing a single' +
    ' or multiple codelists. If the file contains a single' +
    ' codelist, there must be a minimum of two columns,' +
    ' one containing the medical code itself, and the other' +
    ' specifying which medical ontology the code comes from.' +
    ' If there are multiple codelists within the file,' +
    ' we require a third column containing the name of the' +
    ' codelist.',
  sheet_select: 'Please select the sheet to import.',
  map_columns:
    'Please use the dropdowns to map column headers from your' +
    ' imported file to the required fields of Code and Ontology' +
    ' (aka code type, vocabulary, etc). If the file contains' +
    ' a single codelist, please enter the name of the' +
    ' codelist. If the file contains multiple' +
    ' codelists, please select ‘File contains multiple' +
    ' codelists’ and map the name of the column header' +
    ' containing codelist name using the codelist' +
    ' name dropdown.',
  map_ontologies:
    'On the left you see the ontologies found in your imported' +
    ' file i.e. all unique values found in the ‘Ontology’ column' +
    ' of the file (which you mapped in the previous step).' +
    ' From the dropdowns you will see all ontologies that we' +
    ' provide through the Medical Concept Builder.' +
    ' Please select the ontology from the dropdown that' +
    ' corresponds to the ontology named in your file.',
  finalize:
    'The import summary shows you basic information about how' +
    ' many codes were successfully imported. This import summary' +
    ' is saved for each codelist within it’s description,' +
    ' which you can see in the active codelist tray.' +
    ' Please make corrections to the codelists within' +
    ' the Medical Concept Builder.',
}

export default ImportFromFile
