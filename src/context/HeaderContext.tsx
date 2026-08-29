import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

export interface HeaderDetails {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

interface HeaderContextType {
  headerDetails: HeaderDetails
  setHeaderDetails: (details: HeaderDetails) => void
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined)

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [headerDetails, setHeaderDetails] = useState<HeaderDetails>({})

  return (
    <HeaderContext.Provider value={{ headerDetails, setHeaderDetails }}>
      {children}
    </HeaderContext.Provider>
  )
}

export function useHeader() {
  const context = useContext(HeaderContext)
  if (!context) {
    throw new Error('useHeader must be used within a HeaderProvider')
  }
  return context
}

export function useSetHeader(details: HeaderDetails) {
  const { setHeaderDetails } = useHeader()

  useEffect(() => {
    setHeaderDetails(details)
    return () => {
      setHeaderDetails({})
    }
  }, [details.title, details.description, details.actions])
}
