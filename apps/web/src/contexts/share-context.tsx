"use client";

import { createContext, useContext, type ReactNode } from "react";

interface ShareContextValue {
  token: string;
}

const ShareContext = createContext<ShareContextValue | null>(null);

export function ShareProvider({
  token,
  children,
}: {
  token: string;
  children: ReactNode;
}) {
  return (
    <ShareContext.Provider value={{ token }}>
      {children}
    </ShareContext.Provider>
  );
}

export function useShareContext(): ShareContextValue | null {
  return useContext(ShareContext);
}
