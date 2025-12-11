"use client";

import Provider from "../components/providers/WagmiProvider";
import ThirdwebProvider from "../components/providers/ThirdwebProvider";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThirdwebProvider>
      <Provider>
        <MiniKitProvider
          enabled={true}
          notificationProxyUrl="/api/notify"
          autoConnect={true}
        >
          {children}
        </MiniKitProvider>
      </Provider>
    </ThirdwebProvider>
  );
}
