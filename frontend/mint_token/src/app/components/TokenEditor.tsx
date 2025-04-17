"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const tokenAbi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function logoURL() view returns (string)",
  "function updateLogoURL(string calldata newLogoURL) external",
  "function transferFeePercentage() view returns (uint256)",
  "function setTransferFeePercentage(uint256 newFeePercentage) external",
  "function feeCollector() view returns (address)",
  "function setFeeCollector(address newFeeCollector) external",
  "function owner() view returns (address)"
];

interface TokenEditorProps {
  tokenAddress: string;
  walletConnected: boolean;
  address: string;
}

const TokenEditor = ({ tokenAddress, walletConnected, address }: TokenEditorProps) => {
  const [token, setToken] = useState({
    name: '',
    symbol: '',
    logoURL: '',
    transferFeePercentage: '0',
    feeCollector: '',
    owner: ''
  });
  
  const [newLogoURL, setNewLogoURL] = useState('');
  const [newFeePercentage, setNewFeePercentage] = useState('');
  const [newFeeCollector, setNewFeeCollector] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (walletConnected && tokenAddress) {
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
      
      setToken({
        name,
        symbol,
        logoURL,
        transferFeePercentage: transferFeePercentage.toString(),
        feeCollector,
        owner
      });
      
      setNewLogoURL(logoURL);
      setNewFeePercentage(transferFeePercentage.toString());
      setNewFeeCollector(feeCollector);
      
      // Check if connected wallet is the owner
      setIsOwner(owner.toLowerCase() === address.toLowerCase());
      
    } catch (err) {
      console.error("Error fetching token details:", err);
      setError("Failed to fetch token details. Please make sure this is a valid token address.");
    } finally {
      setLoading(false);
    }
  };

  const updateLogoURL = async () => {
    if (!window.ethereum || !isOwner) return;
    
    setUpdating(true);
    setError('');
    setSuccess('');
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
      
      const tx = await tokenContract.updateLogoURL(newLogoURL);
      await tx.wait();
      
      setToken(prev => ({ ...prev, logoURL: newLogoURL }));
      setSuccess("Logo URL updated successfully!");
    } catch (err) {
      console.error("Error updating logo URL:", err);
      setError(err.message || "Failed to update logo URL");
    } finally {
      setUpdating(false);
    }
  };

  const updateFeePercentage = async () => {
    if (!window.ethereum || !isOwner) return;
    
    setUpdating(true);
    setError('');
    setSuccess('');
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
      
      // Convert percentage to basis points (1% = 100 basis points)
      const feeBasisPoints = Math.floor(parseFloat(newFeePercentage) * 100);
      
      const tx = await tokenContract.setTransferFeePercentage(feeBasisPoints);
      await tx.wait();
      
      setToken(prev => ({ ...prev, transferFeePercentage: newFeePercentage }));
      setSuccess("Transfer fee percentage updated successfully!");
    } catch (err) {
      console.error("Error updating fee percentage:", err);
      setError(err.message || "Failed to update fee percentage");
    } finally {
      setUpdating(false);
    }
  };

  const updateFeeCollector = async () => {
    if (!window.ethereum || !isOwner) return;
    
    setUpdating(true);
    setError('');
    setSuccess('');
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
      
      const tx = await tokenContract.setFeeCollector(newFeeCollector);
      await tx.wait();
      
      setToken(prev => ({ ...prev, feeCollector: newFeeCollector }));
      setSuccess("Fee collector address updated successfully!");
    } catch (err) {
      console.error("Error updating fee collector:", err);
      setError(err.message || "Failed to update fee collector");
    } finally {
      setUpdating(false);
    }
  };

  const formatAddress = (addr: string) => {
    return addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : '';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        <p className="mt-2">Loading token details...</p>
      </div>
    );
  }

  if (error && !token.name) {
    return (
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
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Edit Token: {token.name} ({token.symbol})</h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div>
          <p className="font-medium mb-1">Token Address:</p>
          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded break-all">
            {tokenAddress}
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <p className="font-medium mb-1">Name:</p>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
              {token.name}
            </div>
          </div>
          
          <div className="flex-1">
            <p className="font-medium mb-1">Symbol:</p>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
              {token.symbol}
            </div>
          </div>
        </div>
        
        <div>
          <p className="font-medium mb-1">Owner:</p>
          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
            {token.owner === address ? 'You' : token.owner}
          </div>
        </div>
      </div>
      
      {!isOwner && (
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded mb-6">
          You are not the owner of this token. Only the owner can make changes.
        </div>
      )}
      
      <div className="border-t pt-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Logo URL</h3>
        
        <div className="flex items-center mb-4">
          <p className="font-medium mr-4">Current Logo:</p>
          {token.logoURL ? (
            <img 
              src={token.logoURL} 
              alt={`${token.symbol} logo`} 
              className="h-12 w-12 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/48x48?text=?';
              }} 
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">{token.symbol?.charAt(0) || '?'}</span>
            </div>
          )}
        </div>
        
        {isOwner && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-1">New Logo URL:</label>
              <input
                type="url"
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder="https://example.com/logo.png"
                value={newLogoURL}
                onChange={(e) => setNewLogoURL(e.target.value)}
              />
            </div>
            <div>
              <button
                onClick={updateLogoURL}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded"
                disabled={updating || newLogoURL === token.logoURL}
              >
                {updating ? 'Updating...' : 'Update Logo'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t pt-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Transfer Fee Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <p className="font-medium mb-1">Current Fee Percentage:</p>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
              {token.transferFeePercentage}%
            </div>
          </div>
          
          <div>
            <p className="font-medium mb-1">Current Fee Collector:</p>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
              {token.feeCollector === address ? 'You' : formatAddress(token.feeCollector)}
            </div>
          </div>
        </div>
        
        {isOwner && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">New Fee Percentage:</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="1.5"
                  value={newFeePercentage}
                  onChange={(e) => setNewFeePercentage(e.target.value)}
                  step="0.01"
                  min="0"
                  max="10"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum 10%</p>
              </div>
              <div>
                <button
                  onClick={updateFeePercentage}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  disabled={updating || newFeePercentage === token.transferFeePercentage}
                >
                  {updating ? 'Updating...' : 'Update Fee'}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">New Fee Collector:</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="0x..."
                  value={newFeeCollector}
                  onChange={(e) => setNewFeeCollector(e.target.value)}
                />
              </div>
              <div>
                <button
                  onClick={updateFeeCollector}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  disabled={updating || newFeeCollector === token.feeCollector}
                >
                  {updating ? 'Updating...' : 'Update Collector'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className="text-center mt-6">
        <a
          href={`https://sepolia.tea.xyz/address/${tokenAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          View on Block Explorer
        </a>
      </div>
    </div>
  );
};

export default TokenEditor;
