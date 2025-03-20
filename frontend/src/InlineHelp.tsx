import {InfoCircleOutlined} from '@ant-design/icons'
import {styled} from '@linaria/react'
import {Popover} from 'antd'
import React, {ReactNode} from 'react'
import {useSelector} from 'react-redux'
import {RootState} from './store'

type InlineHelpProps = {
  content: ReactNode
  title?: ReactNode
}

const InlineHelp: React.FC<InlineHelpProps> = ({content, title}) => {
  const enableInfoBubbles = useSelector((state: RootState) => state.ui.enableInfoBubbles)
  if (!enableInfoBubbles) return null
  return (
    <Root
      onClick={(e) => {
        e.stopPropagation()
      }}>
      <Popover
        title={title}
        align={{targetOffset: [0]}}
        arrow={{pointAtCenter: true}}
        placement="bottomLeft"
        content={
          <ContentRoot
            onClick={(e) => {
              e.stopPropagation()
            }}>
            {content}
          </ContentRoot>
        }
        trigger="hover">
        <IconWrap>
          <InfoCircleOutlined style={{color: '#8c8c8c'}} />
        </IconWrap>
      </Popover>
    </Root>
  )
}

export default InlineHelp

const ContentRoot = styled.div`
  max-width: 250px;
  font-size: 12px;
`

const Root = styled.span`
  position: relative;
  margin-left: 5px;
  margin-right: 10px;
`

const IconWrap = styled.span`
  position: absolute;
  top: -5px;
`
