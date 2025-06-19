"use client"
import React, { createContext, useState, useEffect } from 'react'

export const ThemeContext = createContext<{themeMode: 'light' | 'dark', setThemeMode: (mode: 'light' | 'dark') => void}>({ themeMode: 'light', setThemeMode: () => {} });

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('themeMode') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(themeMode);
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
} 