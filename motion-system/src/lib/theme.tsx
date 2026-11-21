import React, { createContext, useContext } from 'react';
import type { Campaign } from '../schema';
import type { Layout } from './layout';

export type Theme = Campaign['brand']['colors'] & {
  display: string;
  body: string;
  mono: string;
};

export const FONT = {
  display: '"Inter Display", Inter, sans-serif',
  body: 'Inter, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

type Ctx = { theme: Theme; L: Layout; campaign: Campaign; debug: boolean };
const C = createContext<Ctx | null>(null);

export const ThemeProvider: React.FC<Ctx & { children: React.ReactNode }> = ({ children, ...v }) => (
  <C.Provider value={v}>{children}</C.Provider>
);

export function useStage() {
  const v = useContext(C);
  if (!v) throw new Error('useStage outside ThemeProvider');
  return v;
}
