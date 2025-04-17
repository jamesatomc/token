"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function WalletConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState("");
  const [error, setError] = useState("");

  const TEA_CHAIN_ID = "10218";
  const TEA_CHAIN_ID_HEX = "0x27DA";

  // Check if wallet is already connected
  useEffect(() => {
    checkConnection();
    
    // Add event listeners
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", checkConnection);
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", checkConnection);
      }
    };
  }, []);

  async function checkConnection() {
    try {
      if (!window.ethereum) {
        setError("No wallet detected");
        return;
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        setIsConnected(true);
        setAddress(accounts[0].address);
        
        const network = await provider.getNetwork();
        setChainId(network.chainId.toString());
      } else {
        setIsConnected(false);
        setAddress("");
      }
    } catch (err) {
      console.error(err);
      setIsConnected(false);
    }
  }

  async function connectWallet() {
    try {
      setError("");
      if (!window.ethereum) {
        setError("Please install MetaMask or another Web3 wallet");
        return;
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        setIsConnected(true);
        setAddress(accounts[0].address);
        
        const network = await provider.getNetwork();
        setChainId(network.chainId.toString());
        
        // Check if we're on TEA Network testnet
        if (network.chainId.toString() !== TEA_CHAIN_ID) {
          switchToTEANetwork();
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect wallet");
    }
  }

  async function switchToTEANetwork() {
    try {
      if (!window.ethereum) return;
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: TEA_CHAIN_ID_HEX }], // TEA Network Testnet chainId in hex
      });
    } catch (err: any) {
      // If user doesn't have TEA Network in their MetaMask, let's add it
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: TEA_CHAIN_ID_HEX,
                chainName: 'TEA Network Testnet',
                nativeCurrency: {
                  name: 'TEA',
                  symbol: 'TEA',
                  decimals: 18,
                },
                rpcUrls: ['https://tea-sepolia.g.alchemy.com/public'],
                blockExplorerUrls: ['https://sepolia.tea.xyz/'],
              },
            ],
          });
        } catch (addError) {
          console.error(addError);
        }
      } else {
        console.error("Error switching to TEA Network Testnet:", err);
      }
    }
  }

  function formatAddress(address: string) {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  return (
    <div className="flex flex-col items-center mb-6">
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {!isConnected ? (
        <button 
          onClick={connectWallet}
          className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="flex flex-col items-center">
          <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md mb-2">
            <span className="font-mono">{formatAddress(address)}</span>
          </div>
          <p className="text-sm">
            {chainId === TEA_CHAIN_ID ? (
              <span className="text-green-600">Connected to TEA Network Testnet</span>
            ) : (
              <span className="text-yellow-600">
                Wrong Network - Please switch to TEA Network Testnet
                <button
                  onClick={switchToTEANetwork}
                  className="ml-2 underline text-blue-600"
                >
                  Switch
                </button>
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
