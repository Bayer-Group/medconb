import {styled} from '@linaria/react'
import React, {useEffect, useState} from 'react'
import messages from './witty_messages'
import sample from 'lodash/sample'

const Witties = () => {
  const [message, sestMessage] = useState(sample(messages))
  useEffect(() => {
    const interval = setInterval(() => {
      sestMessage(sample(messages))
    }, 5000)
    return () => clearInterval(interval)
  }, [])
  return <Root>{message}</Root>
}

export default Witties

export const Root = styled.p`
  text-align: center;
  padding-top: 10px;
  padding-bottom: 10px;
`
