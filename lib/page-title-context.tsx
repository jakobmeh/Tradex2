'use client'

import { createContext, useContext, useState } from 'react'

type ContextType = {
  titles: Record<string, string>
  setTitle: (id: string, title: string) => void
}

const PageTitleContext = createContext<ContextType>({ titles: {}, setTitle: () => {} })

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [titles, setTitles] = useState<Record<string, string>>({})
  return (
    <PageTitleContext.Provider
      value={{
        titles,
        setTitle: (id, title) => setTitles((p) => ({ ...p, [id]: title })),
      }}
    >
      {children}
    </PageTitleContext.Provider>
  )
}

export function usePageTitles() {
  return useContext(PageTitleContext)
}
