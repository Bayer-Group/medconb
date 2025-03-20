import React from 'react'
import { Empty as AntdEmpty} from 'antd'

import {styled} from '@linaria/react'
import {Link} from 'react-router-dom'

const Empty: React.FC<{type: string}> = ({type}) => {
  return (
    <Root>
      <AntdEmpty
        image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
        imageStyle={{
          height: 60,
        }}
        description={
          <span>
            You have no active {type}.
            <br />
            Open one from your workspace or find one in the <Link to={`/`}>search</Link>
          </span>
        }
      />
    </Root>
  )
}

export default Empty

const Root = styled.div`
  text-align: center;
  padding-top: 15%;
`
