import React from 'react'
import ChangeHistory from '../src/components/ChangeHistory'

export default {
  component: ChangeHistory,
  title: 'ChangeHistory',
}

const Template = (args: any) => {
  return (
    <div style={{width: 300, border: '1px solid #000', minHeight: 400}}>
      <ChangeHistory {...args} />
    </div>
  )
}

export const Default = Template.bind({})

Default.args = {
  history: [
    {
      message:
        'Change Message ipsLorem ipsumLorem ipsumLorem ipsumLorem ipsumumLorem ipsLorem ipsumLorem ipsumLorem ipsumLorem ipsumumLorem ipsLorem ipsumLorem ipsumLorem ipsumLorem ipsumumLorem ipsLorem ipsumLorem ipsumLorem ipsumLorem ipsumum',
      removed: [1, 2, 3, 4, 5, 6],
      added: [7, 8, 9],
      user: 'Susanne Feldt',
      date: '2022-07-05',
    },
    {
      message: 'because paper XY states ..., we removed YZ',
      removed: [7, 8, 9],
      added: [1, 2, 3],
      user: 'Rajesh Sharma',
      date: '2022-06-05',
    },
    {
      message:
        'Change Message ipsLorem ipsumLorem ipsumLorem ipsumLorem ipsumumLorem ipsLorem ipsumLorem ipsumLorem ipsumLorem ipsumumLorem ipsLorem ipsumLorem ipsumLorem ipsumLorem ipsumumLorem ipsLorem ipsumLorem ipsumLorem ipsumLorem ipsumum',
      removed: [1, 2],
      added: [6, 8, 9],
      user: 'Susanne Feldt',
      date: '2022-07-05',
    },
    {
      message:
        'Change Message ipsLorem ipsumLorem ipsumLorem ipsumLorem ipsumumLorem ipsLorem ipsumLorem ipsumLorem ipsumLorem ipsumumLorem ipsLorem ipsumLorem ipsumLorem ipsumLorem ipsumumLorem ipsLorem ipsumLorem ipsumLorem ipsumLorem ipsumum',
      removed: [9, 8, 7],
      added: [2, 3, 5],
      user: 'Susanne Feldt',
      date: '2022-07-05',
    },
  ],
}
