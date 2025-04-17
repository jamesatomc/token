"use client";

import { useState, useEffect } from 'react';
import { switchToTeaNetwork, TEA_NETWORK } from '../../utils/networkConfig';

const WalletConnect = () => {
  const [address, setAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
            
            const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
            const networkChainId = parseInt(chainIdHex, 16);
            setChainId(networkChainId);
            setIsCorrectNetwork(networkChainId === parseInt(TEA_NETWORK.chainId, 16));
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };
    
    checkConnection();
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
        } else {
          setAddress("");
          setIsConnected(false);
        }
      });
      
      window.ethereum.on('chainChanged', (chainIdHex: string) => {
        const networkChainId = parseInt(chainIdHex, 16);
        setChainId(networkChainId);
        setIsCorrectNetwork(networkChainId === parseInt(TEA_NETWORK.chainId, 16));
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask or another Ethereum wallet");
      return;
    }
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAddress(accounts[0]);
      setIsConnected(true);
      
      // Check if on correct network
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const networkChainId = parseInt(chainIdHex, 16);
      setChainId(networkChainId);
      setIsCorrectNetwork(networkChainId === parseInt(TEA_NETWORK.chainId, 16));
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const handleSwitchNetwork = async () => {
    const success = await switchToTeaNetwork();
    if (success) {
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const networkChainId = parseInt(chainIdHex, 16);
      setChainId(networkChainId);
      setIsCorrectNetwork(networkChainId === parseInt(TEA_NETWORK.chainId, 16));
    }
  };

  const formatAddress = (addr: string) => {
    return addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : '';
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
      {!isConnected ? (
        <button
          onClick={connectWallet}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded shadow-lg transition duration-200"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="bg-green-100 text-green-800 py-2 px-4 rounded-full font-medium flex items-center">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
            {formatAddress(address)}
          </div>
          
          {!isCorrectNetwork && (
            <button
              onClick={handleSwitchNetwork}
              className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded shadow-lg transition duration-200"
            >
              Switch to TEA Network
            </button>
          )}
        </div>
      )}
      
      {isConnected && isCorrectNetwork && (
        <div className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm">
          TEA Network Connected
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
