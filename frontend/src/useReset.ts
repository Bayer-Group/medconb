import {useCallback, useContext} from 'react'
import {AppContext} from './AppProvider'
import {useDispatch} from 'react-redux'
import localforage from 'localforage'

const useReset = () => {
  const {reduxPersistor} = useContext(AppContext)
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
