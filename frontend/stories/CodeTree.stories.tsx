import {xor} from 'lodash'
import React, {useCallback, useState} from 'react'
import CodeTree, {CodeTreeData, Ontology} from '../src/components/CodeTree'
import onto from '../codes_example.json'

export default {
  component: CodeTree,
  title: 'CodeTree',
}

// const Template = (args: any) => <CodeTree {...args} />

const Template = ({...args}) => {
  const [value, setValue] = useState(args.data)

  const onCodeToggle = useCallback(
    (code: number, concept: number) => {
      setValue({...value, [concept]: xor(value[concept], [code])})
    },
    [value],
  )

  return (
    <div style={{width: 500, border: '1px solid #ddd'}}>
      <CodeTree onCodeChange={onCodeToggle} ontology={onto as Ontology} value={value} />
    </div>
  )
}

export const Default = Template.bind({})
Default.args = {
  data: {
    1: [],
  } as CodeTreeData,
}
export const Selected = Template.bind({})

Selected.args = {
  data: {
    1: [4815, 4819, 4841],
    2: [4815, 4822, 4824],
    3: [4815, 4824],
  } as CodeTreeData,
}

const sampleICD10: Ontology = {
  id: 123,
  name: 'ICD10',
  codes: [
    {
      id: 1,
      code: 'A00',
      description: 'Certain Infectious and parasitic diseases',
      children: [
        {
          id: 2,
          code: 'A00-1',
          description: 'Certain Infectious and parasitic diseases',
        },
      ],
    },
    {
      id: 3,
      code: 'A01',
      description: 'Certain Infectious and parasitic diseases',
      children: [
        {
          id: 4,
          code: 'A01-B90',
          description: 'Certain Infectious and parasitic diseases',
        },
        {
          id: 5,
          code: 'A01-B91',
          description: 'Certain Infectious and parasitic diseases',
        },
      ],
    },
    {
      id: 6,
      code: 'A02',
      description: 'Certain Infectious and parasitic diseases',
      children: [
        {
          id: 7,
          code: 'A02-1',
          description: 'Certain Infectious and parasitic diseases',
        },
      ],
    },
    {
      id: 8,
      code: 'A03',
      description: 'Certain Infectious and parasitic diseases',
      children: [
        {
          id: 9,
          code: 'A03-B80',
          description: 'Certain Infectious and parasitic diseases',
        },
        {
          id: 10,
          code: 'A03-B81',
          description: 'Certain Infectious and parasitic diseases',
          children: [
            {
              id: 11,
              code: 'A00-B81-1',
              description: 'Certain Infectious and parasitic diseases',
            },
            {
              id: 12,
              code: 'A00-B81-2',
              description: 'Certain Infectious and parasitic diseases',
            },
          ],
        },
        {
          id: 13,
          code: 'A03-B82',
          description: 'Certain Infectious and parasitic diseases',
        },
        {
          id: 14,
          code: 'A03-B83',
          description: 'Certain Infectious and parasitic diseases',
        },
      ],
    },
  ],
}
