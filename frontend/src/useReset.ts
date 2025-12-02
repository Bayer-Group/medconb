import {useCallback, useContext} from 'react'
import {AppContext} from './AppProvider'
import {useDispatch} from 'react-redux'
import localforage from 'localforage'
import {db} from './db'

const useReset = () => {
  const {reduxPersistor} = useContext(AppContext)
  const dispatch = useDispatch()

  const handleReset = useCallback(async (resetOntologies = false) => {
    reduxPersistor.pause()
    dispatch({
      type: 'medconb/reset',
    })
    await reduxPersistor.purge()
    await localforage.clear()

    if (resetOntologies) {
      await db.delete({disableAutoOpen: false})
    }
    // reduxPersistor.persist()
    window.location.replace('/')
  }, [])

  return handleReset
}

export default useReset
