import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ReaderSettings {
  fontSize: number;
  font: string;
  bgColor: string;
  singlePage: boolean;
}

const mockSettings: ReaderSettings = {
  fontSize: 16,
  font: 'inherit',
  bgColor: '#fff',
  singlePage: false,
};

const SettingsContext = createContext<{
  settings: ReaderSettings;
  setSettings: React.Dispatch<React.SetStateAction<ReaderSettings>>;
}>({ settings: mockSettings, setSettings: () => {} });

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ReaderSettings>(mockSettings);
  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
