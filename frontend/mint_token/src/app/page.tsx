"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import components to avoid hydration issues
const WalletConnect = dynamic(() => import('./components/WalletConnect'), { ssr: false });
const TokenForm = dynamic(() => import('./components/TokenForm'), { ssr: false });
const TokenList = dynamic(() => import('./components/TokenList'), { ssr: false });

function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [activeTab, setActiveTab] = useState("create"); // "create" or "view"

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
      window.ethereum.on('accountsChanged', (accounts) => {
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
        <header className="flex flex-col items-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center">Token Minting Platform</h1>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
            Create and deploy your custom ERC20 tokens on TEA Network Testnet
          </p>
          <WalletConnect />
        </header>
        
        {walletConnected && (
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => setActiveTab("create")}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                  activeTab === "create"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                }`}
              >
                Create New Token
              </button>
              <button
                onClick={() => setActiveTab("view")}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                  activeTab === "view"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                }`}
              >
                View & Edit Tokens
              </button>
            </div>
          </div>
        )}
        
        <main className="mb-12">
          {activeTab === "create" ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-8">
                <TokenForm walletConnected={walletConnected} address={address} />
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
                      href="https://sepolia.tea.xyz/address/0x1e8c007A328701fDc34761990CAae81359698CB7"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-1 text-blue-600 hover:underline break-all"
                    >
                      0x1e8c007A328701fDc34761990CAae81359698CB7
                    </a>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <TokenList walletConnected={walletConnected} address={address} />
          )}
        </main>
        
        <footer className="text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>Made with ❤️ by the Token Minting Platform Team</p>
        </footer>
      </div>
    </div>
  );
}

export default Home;
