import React from 'react'
import CollectionMenuEntry from '../src/components/MenuEntry'
import MenuTree from '../src/components/MenuTree'

export default {
  component: MenuTree,
  title: 'MenuTree',
}

const Template = (args: any) => {
  return (
    <div style={{width: 250, border: '1px solid #000', minHeight: 400}}>
      <MenuTree
        renderNode={(node) => (
          <CollectionMenuEntry
            value={node.text}
            onRename={console.log}
            // onClickDetails={console.log}
            // onDelete={console.log}
            // onDuplicate={console.log}
            // onShare={console.log}
          />
        )}
        {...args}
      />
    </div>
  )
}

export const Default = Template.bind({})

Default.args = {
  data: [
    {
      id: 1,
      parent: 0,
      droppable: true,
      text: 'Folder 1',
    },
    {
      id: 2,
      parent: 1,
      droppable: false,
      text: 'File 1-1',
      data: {
        fileType: 'csv',
        fileSize: '0.5MB',
      },
    },
    {
      id: 3,
      parent: 1,
      droppable: false,
      text: 'File 1-2',
      data: {
        fileType: 'text',
        fileSize: '4.8MB',
      },
    },
    {
      id: 4,
      parent: 0,
      droppable: true,
      text: 'Folder 2',
    },
    {
      id: 5,
      parent: 4,
      droppable: true,
      text: 'Folder 2-1',
    },
    {
      id: 6,
      parent: 5,
      droppable: false,
      text: 'File 2-1-1',
      data: {
        fileType: 'image',
        fileSize: '2.1MB',
      },
    },
    {
      id: 7,
      parent: 0,
      droppable: false,
      text: 'File 3',
      data: {
        fileType: 'image',
        fileSize: '0.8MB',
      },
    },
  ],
}
