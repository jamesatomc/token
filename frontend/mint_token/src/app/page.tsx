"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import components to avoid hydration issues
const WalletConnect = dynamic(
  () => import("./components/WalletConnect"),
  { ssr: false }
);

const TokenForm = dynamic(
  () => import("./components/TokenForm"),
  { ssr: false }
);

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [address, setAddress] = useState("");

  useEffect(() => {
    // Check if ethereum object exists (MetaMask or similar wallet)
    if (typeof window !== "undefined" && window.ethereum) {
      const checkConnection = async () => {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletConnected(true);
            setAddress(accounts[0]);
          }
        } catch (error) {
          console.error("Error checking connection:", error);
        }
      };
      
      checkConnection();
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletConnected(true);
          setAddress(accounts[0]);
        } else {
          setWalletConnected(false);
          setAddress("");
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col items-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center">Token Minting Platform</h1>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
            Create and deploy your custom ERC20 tokens on TEA Network Testnet
          </p>
          
          <WalletConnect />
        </header>
        
        <main className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8">
              <TokenForm 
                walletConnected={walletConnected} 
                address={address}
              />
            </div>
            
            <div className="md:col-span-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">About This Project</h2>
                <p className="mb-4 text-gray-600 dark:text-gray-300">
                  This platform allows you to create custom ERC20 tokens with various features:
                </p>
                
                <ul className="list-disc pl-5 mb-4 text-gray-600 dark:text-gray-300 space-y-2">
                  <li>Custom token name and symbol</li>
                  <li>Configurable initial supply</li>
                  <li>Optional transfer fees</li>
                  <li>Custom logo URL for your token</li>
                </ul>
                
                <p className="text-gray-600 dark:text-gray-300">
                  Your tokens are deployed to the TEA Network Testnet using the TokenFactory smart contract at: 
                  <a 
                    href="https://sepolia.tea.xyz/address/0xEa55E9D1A46E2d25c618163C862A6aa910EDb637" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-1 text-blue-600 hover:underline break-all"
                  >
                    0xEa55E9D1A46E2d25c618163C862A6aa910EDb637
                  </a>
                </p>
              </div>
            </div>
          </div>
        </main>
        
        <footer className="text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>Made with ❤️ by the Token Minting Platform Team</p>
        </footer>
      </div>
    </div>
  );
}
