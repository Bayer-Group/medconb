import React, {useState} from 'react'
import {Codelist} from '..'
import {ChangeSet} from './store/changes'
import {keys, xor} from 'lodash'
import {Button, Checkbox, Space, Typography} from 'antd'
import {CaretDownFilled, CaretRightFilled, MinusCircleFilled, PlusCircleFilled} from '@ant-design/icons'
import {ChangeSetDisplay} from './SaveCodelist'

const {Text} = Typography

const DiscardDialog = ({codelist, changeSet}: {codelist: Codelist; changeSet: ChangeSet}) => {
  const [supress, setSupress] = useSupressDiscardWarning()
  const [codesExpanded, setCodesExpanded] = useState<string[]>([])

  return (
    <>
      Are you sure you want to discard the changes you made to the codelist <strong>{codelist.name}</strong>?
      <br />
      The following change will be discarded.
      <br />
      <br />
      {keys(changeSet)
        .filter((ontology) => !(changeSet[ontology].added.length === 0 && changeSet[ontology].removed.length === 0))
        .map((ontology) => (
          <React.Fragment key={ontology}>
            <div>
              <Space align="center">
                <Text>{ontology}</Text>
                {changeSet[ontology].added.length > 0 && (
                  <>
                    <PlusCircleFilled style={{color: '#00BCFF'}} />
                    {changeSet[ontology].added.length}
                  </>
                )}
                {changeSet[ontology].removed.length > 0 && (
                  <>
                    <MinusCircleFilled />
                    {changeSet[ontology].removed.length}
                  </>
                )}

                <Button
                  size="small"
                  type="text"
                  style={{
                    opacity: codesExpanded.includes(ontology) ? 1 : 0.5,
                    fontSize: 12,
                    fontWeight: 'normal',
                  }}
                  icon={codesExpanded.includes(ontology) ? <CaretDownFilled /> : <CaretRightFilled />}
                  onClick={() => setCodesExpanded(xor(codesExpanded, [ontology]))}>
                  Show codes
                </Button>
              </Space>
              {codesExpanded.includes(ontology) && (
                <div style={{paddingLeft: 4}}>
                  <ChangeSetDisplay changeSet={changeSet[ontology]} />
                </div>
              )}
            </div>
          </React.Fragment>
        ))}
      <br />
      <Checkbox
        checked={supress === SUPRESS_DISCARD_WARNING_STATE.true}
        onChange={(e) => {
          setSupress(e.target.checked ? SUPRESS_DISCARD_WARNING_STATE.true : SUPRESS_DISCARD_WARNING_STATE.false)
        }}>
        Don't ask me again in this session
      </Checkbox>
    </>
  )
}
export default DiscardDialog

export enum SUPRESS_DISCARD_WARNING_STATE {
  true = 'true',
  false = 'false',
}
export const useSupressDiscardWarning = () => {
  const setSupressState = (newValue: SUPRESS_DISCARD_WARNING_STATE) => {
    window.sessionStorage.setItem('SUPRESS_DISCARD_WARNING_STATE', newValue)
    window.dispatchEvent(new StorageEvent('storage', {key: 'SUPRESS_DISCARD_WARNING_STATE', newValue}))
  }

  const getSnapshot = () =>
    window.sessionStorage.getItem('SUPRESS_DISCARD_WARNING_STATE') as SUPRESS_DISCARD_WARNING_STATE

  const subscribe = (listener: () => void) => {
    window.addEventListener('storage', listener)
    return () => void window.removeEventListener('storage', listener)
  }

  const store = React.useSyncExternalStore(subscribe, getSnapshot)
  return [store, setSupressState] as const
}
