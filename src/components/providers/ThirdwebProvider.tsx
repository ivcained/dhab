"use client";

import { ThirdwebProvider as TWProvider } from "thirdweb/react";
import { ReactNode } from "react";

interface ThirdwebProviderProps {
  children: ReactNode;
}

export default function ThirdwebProvider({ children }: ThirdwebProviderProps) {
  return <TWProvider>{children}</TWProvider>;
}
