import Icon, {CaretRightOutlined} from '@ant-design/icons'
import {Button, Tooltip} from 'antd'
import React, {useState} from 'react'
import {Headline, Section, Title, ToggleIcon} from './scratch'
import InlineHelp from './InlineHelp'
import {GoIcon} from './customIcons'

type PublicLibrariesProps = {}

const PublicLibraries: React.FC<PublicLibrariesProps> = () => {
  const [open, toggleOpen] = useState(false)
  return (
    <Section>
      <Headline>
        <ToggleIcon
          onClick={() => toggleOpen(!open)}
          isOpen={open}
          size="small"
          type="text"
          icon={<CaretRightOutlined />}
        />
        <Title>
          Public Libraries
          <InlineHelp content="A feature to share Medical Concepts with everyone will be here soon! :D" />
        </Title>
        <Tooltip placement="right" title={'Open marketplace'}>
          <Button size="small" type="text" icon={<Icon component={() => <GoIcon />} />}></Button>
        </Tooltip>
      </Headline>
      {open && (
        <div style={{paddingLeft: 8, paddingTop: 8}}>
          {/* <MenuTree data={sampleMenu} renderNode={(node) => <PublicLibraryEntry value={node.text} />} /> */}
        </div>
      )}
    </Section>
  )
}

export default PublicLibraries

const sampleMenu = [
  {
    id: 1,
    parent: 0,
    droppable: true,
    text: 'Alcohol Abuse Studies',
  },
  {
    id: 2,
    parent: 1,
    droppable: false,
    text: 'Liver Damage',
    data: {
      fileType: 'csv',
      fileSize: '0.5MB',
    },
  },
  {
    id: 3,
    parent: 1,
    droppable: false,
    text: 'Unnamed Collection',
    data: {
      fileType: 'text',
      fileSize: '4.8MB',
    },
  },
  {
    id: 4,
    parent: 0,
    droppable: true,
    text: 'My temp Collection',
  },
  {
    id: 5,
    parent: 4,
    droppable: true,
    text: 'Not working',
  },
  {
    id: 6,
    parent: 5,
    droppable: false,
    text: 'What is this?',
    data: {
      fileType: 'image',
      fileSize: '2.1MB',
    },
  },
  {
    id: 7,
    parent: 0,
    droppable: true,
    text: 'Oh right!',
    data: {
      fileType: 'image',
      fileSize: '0.8MB',
    },
  },
]
