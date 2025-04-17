"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const tokenFactoryAbi = [
  "function getTokenCount() external view returns (uint256)",
  "function getTokensByCreator(address creator) external view returns (address[])",
  "function getTokensPaginated(uint256 start, uint256 limit) external view returns (address[])",
  "function tokenInfo(address) external view returns (string memory name, string memory symbol, address creator, bool exists)"
];

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

interface TokenData {
  address: string;
  name: string;
  symbol: string;
  totalSupply: string;
  creator: string;
  logoURL: string;
  transferFeePercentage: string;
  feeCollector: string;
  owner: string;
}

const TokenList = ({ address, walletConnected }) => {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAllTokens, setShowAllTokens] = useState(false);
  const contractAddress = "0x1e8c007A328701fDc34761990CAae81359698CB7";

  useEffect(() => {
    if (walletConnected && address) {
      fetchTokens();
    }
  }, [walletConnected, address, showAllTokens]);

  const fetchTokens = async () => {
    if (!window.ethereum) return;
    
    setLoading(true);
    setError("");
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, tokenFactoryAbi, provider);
      
      let tokenAddresses;
      if (showAllTokens) {
        // Get total token count
        const tokenCount = await contract.getTokenCount();
        // Fetch all tokens with pagination (limit to 100 for performance)
        tokenAddresses = await contract.getTokensPaginated(0, 100);
      } else {
        // Only get tokens created by the connected user
        tokenAddresses = await contract.getTokensByCreator(address);
      }
      
      const tokenPromises = tokenAddresses.map(async (tokenAddress) => {
        try {
          const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);
          const tokenInfo = await contract.tokenInfo(tokenAddress);
          
          // Get additional token details
          const name = await tokenContract.name();
          const symbol = await tokenContract.symbol();
          const decimals = await tokenContract.decimals();
          const totalSupply = ethers.formatUnits(await tokenContract.totalSupply(), decimals);
          let logoURL = "";
          let transferFeePercentage = "0";
          let feeCollector = ethers.ZeroAddress;
          let owner = ethers.ZeroAddress;
          
          try {
            logoURL = await tokenContract.logoURL();
            transferFeePercentage = (await tokenContract.transferFeePercentage()) / 100; // Convert basis points to percentage
            feeCollector = await tokenContract.feeCollector();
            owner = await tokenContract.owner();
          } catch (e) {
            // Some functions might not exist on all tokens
            console.warn("Failed to fetch some token details", e);
          }
          
          return {
            address: tokenAddress,
            name,
            symbol,
            totalSupply,
            creator: tokenInfo.creator,
            logoURL,
            transferFeePercentage: `${transferFeePercentage}%`,
            feeCollector,
            owner
          };
        } catch (e) {
          console.error("Error fetching token data:", e);
          return null;
        }
      });
      
      const tokenData = (await Promise.all(tokenPromises)).filter(token => token !== null);
      setTokens(tokenData);
    } catch (err) {
      console.error("Error fetching tokens:", err);
      setError("Failed to fetch tokens. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr: string) => {
    return addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : '';
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Tokens</h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={showAllTokens}
              onChange={() => setShowAllTokens(!showAllTokens)}
            />
            <span className="text-sm">Show all tokens</span>
          </label>
          <button
            onClick={fetchTokens}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded transition"
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading tokens...</p>
        </div>
      )}
      
      {!loading && tokens.length === 0 && (
        <div className="text-center py-6 bg-gray-50 dark:bg-gray-700 rounded">
          <p className="text-gray-500 dark:text-gray-400">
            {showAllTokens ? "No tokens have been created yet." : "You haven't created any tokens yet."}
          </p>
        </div>
      )}
      
      {tokens.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Logo</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Symbol</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Supply</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fee</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {tokens.map((token) => (
                <tr key={token.address} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-4 whitespace-nowrap">
                    {token.logoURL ? (
                      <img 
                        src={token.logoURL} 
                        alt={`${token.symbol} logo`} 
                        className="h-8 w-8 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/32x32?text=?';
                        }} 
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">{token.symbol?.charAt(0) || '?'}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">{token.name}</td>
                  <td className="px-3 py-4 whitespace-nowrap">{token.symbol}</td>
                  <td className="px-3 py-4 whitespace-nowrap">{token.totalSupply}</td>
                  <td className="px-3 py-4 whitespace-nowrap">{token.transferFeePercentage}</td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <a
                        href={`/token/${token.address}`}
                        className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                        title="View Token Details"
                      >
                        View
                      </a>
                      {token.owner.toLowerCase() === address.toLowerCase() && (
                        <a
                          href={`/token/edit/${token.address}`}
                          className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                          title="Edit Token"
                        >
                          Edit
                        </a>
                      )}
                      <a
                        href={`https://sepolia.tea.xyz/address/${token.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-900 dark:hover:text-purple-400"
                        title="View on Block Explorer"
                      >
                        Explorer
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TokenList;
