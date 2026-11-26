import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(() => {
    return localStorage.getItem('emi_tema') || 'claro'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
    localStorage.setItem('emi_tema', tema)
  }, [tema])

  const toggleTema = () => setTema((t) => (t === 'claro' ? 'oscuro' : 'claro'))

  return <ThemeContext.Provider value={{ tema, toggleTema }}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext)
}
