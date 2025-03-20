import {CaretDownFilled, CheckOutlined} from '@ant-design/icons'
import {styled} from '@linaria/react'
import {Button, Dropdown, Space} from 'antd'
import React, {useCallback, useMemo} from 'react'
import {MenuInfo} from 'rc-menu/lib/interface'
import {find} from 'lodash'
import {LocalOntology, Ontology} from '../..'
import InlineHelp from '../InlineHelp'

type SelectOntologyProps = {
  ontologies: LocalOntology[]
  value?: LocalOntology
  onChange: (ontology: LocalOntology) => void
}

const SelectOntology: React.FC<SelectOntologyProps> = ({ontologies, value, onChange}) => {
  const handleMenuClick = useCallback((info: MenuInfo) => {
    onChange(find(ontologies, {name: info.key}) as LocalOntology)
  }, [])

  const items = useMemo(
    () =>
      ontologies.map((ontology) => ({
        label: ontology.name,
        key: ontology.name,
        icon: (
          <Space>
            {/* <Badge status="warning" /> */}
            <CheckOutlined style={{color: value?.name === ontology.name ? 'initial' : '#fff'}} />
          </Space>
        ),
      })),
    [value],
  )
  return (
    <>
      <Dropdown menu={{onClick: handleMenuClick, items}} trigger={['click']}>
        <Root>
          <Space>
            {value?.name} <CaretDownFilled />
          </Space>
        </Root>
      </Dropdown>
      <InlineHelp
        content={
          'This is the Ontology Selector. Click on this dropdown and select the Ontology you wish to view.' +
          ' The codes of that Ontology will be displayed below.' +
          ' By default, the Ontology Viewer displays an Ontology as hierarchical tree.' +
          ' Click on the carets (triangles) or simply the code description to view lower level codes.' +
          ' For quick actions or quick filters, please use the ellipses (three dots) button to the right.'
        }
      />
    </>
  )
}

export default SelectOntology

const Root = styled(Button)`
  border-radius: 16px;
  font-size: 12px;
`
