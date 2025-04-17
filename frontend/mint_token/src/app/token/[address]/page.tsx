"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ethers } from 'ethers';

const WalletConnect = dynamic(() => import('../../components/WalletConnect'), { ssr: false });

interface TokenDetailsProps {
  params: {
    address: string;
  };
}

const tokenAbi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function logoURL() view returns (string)",
  "function transferFeePercentage() view returns (uint256)",
  "function feeCollector() view returns (address)",
  "function owner() view returns (address)"
];

const TokenDetailsPage = ({ params }: TokenDetailsProps) => {
  const router = useRouter();
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenDetails, setTokenDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (params?.address) {
      setTokenAddress(params.address);
    }
  }, [params]);

  useEffect(() => {
    if (tokenAddress && walletConnected) {
      fetchTokenDetails();
    }
  }, [tokenAddress, walletConnected]);

  const fetchTokenDetails = async () => {
    if (!window.ethereum || !tokenAddress) return;
    
    setLoading(true);
    setError('');
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);
      
      const name = await tokenContract.name();
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      const totalSupply = ethers.formatUnits(await tokenContract.totalSupply(), decimals);
      let balance = '0';
      
      if (address) {
        balance = ethers.formatUnits(await tokenContract.balanceOf(address), decimals);
      }
      
      let logoURL = "";
      let transferFeePercentage = 0;
      let feeCollector = ethers.ZeroAddress;
      let owner = ethers.ZeroAddress;
      
      try {
        logoURL = await tokenContract.logoURL();
        transferFeePercentage = (await tokenContract.transferFeePercentage()) / 100; // Convert basis points to percentage
        feeCollector = await tokenContract.feeCollector();
        owner = await tokenContract.owner();
      } catch (e) {
        console.warn("Failed to fetch some token details", e);
      }
      
      setTokenDetails({
        name,
        symbol,
        decimals,
        totalSupply,
        balance,
        logoURL,
        transferFeePercentage: `${transferFeePercentage}%`,
        feeCollector,
        owner,
        isOwner: owner.toLowerCase() === address.toLowerCase()
      });
      
    } catch (err) {
      console.error("Error fetching token details:", err);
      setError("Failed to fetch token details. Please make sure this is a valid token address.");
    } finally {
      setLoading(false);
    }
  };

  const handleWalletConnect = (connected: boolean, walletAddress: string) => {
    setWalletConnected(connected);
    setAddress(walletAddress);
  };

  const formatAddress = (addr: string) => {
    return addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : '';
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <button 
            onClick={() => router.push('/')}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold mb-4">Token Details</h1>
          <WalletConnect />
        </header>
        
        {loading ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-2">Loading token details...</p>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
              {error}
            </div>
            <button 
              onClick={fetchTokenDetails}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            >
              Try Again
            </button>
          </div>
        ) : tokenDetails ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
              {tokenDetails.logoURL ? (
                <img 
                  src={tokenDetails.logoURL} 
                  alt={`${tokenDetails.symbol} logo`} 
                  className="h-24 w-24 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/96x96?text=?';
                  }} 
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl">
                  <span className="text-gray-500">{tokenDetails.symbol?.charAt(0) || '?'}</span>
                </div>
              )}
              
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold mb-1">{tokenDetails.name}</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-2">{tokenDetails.symbol}</p>
                
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    ERC20
                  </span>
                  {parseFloat(tokenDetails.transferFeePercentage) > 0 && (
                    <span className="inline-block bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Fee: {tokenDetails.transferFeePercentage}
                    </span>
                  )}
                  {tokenDetails.isOwner && (
                    <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      You are owner
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Supply</p>
                <p className="text-lg font-semibold">{tokenDetails.totalSupply}</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-500 dark:text-gray-400">Your Balance</p>
                <p className="text-lg font-semibold">{tokenDetails.balance}</p>
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
              <h3 className="text-lg font-semibold mb-3">Token Information</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Contract Address</p>
                  <p className="font-mono break-all">{tokenAddress}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Decimals</p>
                  <p>{tokenDetails.decimals}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Owner</p>
                  <p>{tokenDetails.isOwner ? 'You' : tokenDetails.owner}</p>
                </div>
                
                {parseFloat(tokenDetails.transferFeePercentage) > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Fee Collector</p>
                    <p>{tokenDetails.feeCollector === address ? 'You' : tokenDetails.feeCollector}</p>
                  </div>
                )}
                
                {tokenDetails.logoURL && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Logo URL</p>
                    <a 
                      href={tokenDetails.logoURL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {tokenDetails.logoURL}
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 justify-center">
              <a
                href={`https://sepolia.tea.xyz/address/${tokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
              >
                View on Block Explorer
              </a>
              
              {tokenDetails.isOwner && (
                <a
                  href={`/token/edit/${tokenAddress}`}
                  className="inline-block bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
                >
                  Edit Token
                </a>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TokenDetailsPage;
