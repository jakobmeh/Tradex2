'use client'

import { createContext, useCallback, useContext, useRef } from 'react'

type Listener = () => void

type DatabaseRefreshContext = {
  subscribe: (databaseId: string, fn: Listener) => () => void
  notify: (databaseId: string) => void
}

const Ctx = createContext<DatabaseRefreshContext>({
  subscribe: () => () => {},
  notify: () => {},
})

export function DatabaseRefreshProvider({ children }: { children: React.ReactNode }) {
  const listeners = useRef<Map<string, Set<Listener>>>(new Map())

  const subscribe = useCallback((databaseId: string, fn: Listener) => {
    const set = listeners.current.get(databaseId) ?? new Set()
    set.add(fn)
    listeners.current.set(databaseId, set)
    return () => set.delete(fn)
  }, [])

  const notify = useCallback((databaseId: string) => {
    listeners.current.get(databaseId)?.forEach((fn) => fn())
  }, [])

  return <Ctx.Provider value={{ subscribe, notify }}>{children}</Ctx.Provider>
}

export function useDatabaseRefresh() {
  return useContext(Ctx)
}
