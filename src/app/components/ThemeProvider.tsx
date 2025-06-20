"use client"
import React, { createContext, useState, useEffect } from 'react'

export const ThemeContext = createContext<{themeMode: 'light' | 'dark', setThemeMode: (mode: 'light' | 'dark') => void}>({ themeMode: 'light', setThemeMode: () => {} });

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  // Set the theme on initial load
  useEffect(() => {
    const savedTheme = (localStorage.getItem('themeMode') as 'light' | 'dark') || 'light';
    setThemeMode(savedTheme);
    setMounted(true);
  }, []);

  // Update the DOM when theme changes
  useEffect(() => {
    if (!mounted) return;
    
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(themeMode);
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode, mounted]);

  // Don't render the children until we've determined the theme on the client
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
} 