import {useCallback, useContext} from 'react'
import {ApplicationContext} from './ApplicationProvider'
import {useDispatch} from 'react-redux'
import localforage from 'localforage'

const useReset = () => {
  const {reduxPersistor} = useContext(ApplicationContext)
  const dispatch = useDispatch()

  const handleReset = useCallback(async () => {
    reduxPersistor.pause()
    dispatch({
      type: 'medconb/reset',
    })
    await reduxPersistor.purge()
    await localforage.clear()
    // reduxPersistor.persist()
    window.location.replace('/')
  }, [])

  return handleReset
}

export default useReset
