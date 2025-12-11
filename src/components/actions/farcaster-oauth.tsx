"use client";

import { useState, useCallback } from "react";
import { inAppWallet } from "thirdweb/wallets";
import { client } from "~/lib/thirdweb";
import { Button } from "~/components/ui/Button";

export function FarcasterOAuthAction() {
  const [connecting, setConnecting] = useState<boolean>(false);
  const [account, setAccount] = useState<{ address: string } | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleConnect = useCallback(async (): Promise<void> => {
    try {
      setConnecting(true);
      setError(undefined);
      setAccount(null);

      // Create an in-app wallet instance
      const wallet = inAppWallet();

      // Connect using Farcaster OAuth strategy
      const connectedAccount = await wallet.connect({
        client,
        strategy: "farcaster",
      });

      setAccount({ address: connectedAccount.address });
      console.log("Connected as:", connectedAccount.address);
    } catch (err) {
      console.error("Farcaster OAuth error:", err);
      setError(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setConnecting(false);
    }
  }, []);

  return (
    <div className="mb-4">
      <div className="p-3 bg-muted border border-border rounded-lg my-2">
        <pre className="font-mono text-xs text-primary font-medium">
          thirdweb inAppWallet - Farcaster OAuth
        </pre>
      </div>
      <Button onClick={handleConnect} disabled={connecting}>
        {connecting ? "Connecting..." : "Connect with Farcaster (Thirdweb)"}
      </Button>
      {error && !connecting && (
        <div className="my-2 p-3 text-xs overflow-x-scroll bg-muted border border-border rounded-lg font-mono">
          <div className="font-semibold text-muted-foreground mb-1">Error</div>
          <div className="whitespace-pre text-destructive">{error}</div>
        </div>
      )}
      {account && !connecting && (
        <div className="my-2">
          <div className="p-3 text-xs overflow-x-scroll bg-muted border border-border rounded-lg font-mono">
            <div className="font-semibold text-muted-foreground mb-1">
              Connected Account
            </div>
            <div className="whitespace-pre text-primary">
              {JSON.stringify(account, null, 2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
