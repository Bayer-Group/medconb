import Icon from '@ant-design/icons/lib/components/Icon'
import React from 'react'
import {SharedIcon} from '../customIcons'
import {GlobalOutlined, UserOutlined} from '@ant-design/icons'

type VisibilityProps = {
  visibility: 'Public' | 'Private' | 'Shared'
}
const Visibility: React.FC<VisibilityProps> = ({visibility}) => {
  switch (visibility) {
    case 'Public':
      return <GlobalOutlined style={{fill: '#262626'}} />
    case 'Private':
      return <UserOutlined style={{fill: '#262626'}} />
    case 'Shared':
      return <Icon component={() => <SharedIcon fill="#262626" />} />
  }
}

export default Visibility
