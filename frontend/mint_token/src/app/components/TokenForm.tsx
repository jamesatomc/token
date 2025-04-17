"use client";

import { useState } from "react";
import { ethers } from "ethers";

// ABI for the TokenFactory contract (simplified to include just what we need)
const tokenFactoryAbi = [
  "function createToken(string memory name, string memory symbol, uint256 initialSupply, string memory logoURL) external returns (address)",
  "function createTokenWithFee(string memory name, string memory symbol, uint256 initialSupply, string memory logoURL, uint256 feePercentage, address feeCollector) external returns (address)",
  "event TokenCreated(address tokenAddress, string name, string symbol, uint256 initialSupply, address creator)"
];

interface TokenFormProps {
  walletConnected: boolean;
  address?: string;
}

export default function TokenForm({ walletConnected, address }: TokenFormProps) {
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [initialSupply, setInitialSupply] = useState("1000");
  const [logoURL, setLogoURL] = useState("");
  const [useFee, setUseFee] = useState(false);
  const [feePercentage, setFeePercentage] = useState("0");
  const [feeCollector, setFeeCollector] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");
  const [error, setError] = useState("");
  const [createdTokenAddress, setCreatedTokenAddress] = useState("");

  const contractAddress = "0x6FD802f110E6D40a00c69F68BEDD4c5ffCA8C2BB";

  async function createToken(e: React.FormEvent) {
    e.preventDefault();
    if (!window.ethereum) {
      setError("MetaMask or compatible wallet not found");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setTransactionHash("");
    setCreatedTokenAddress("");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, tokenFactoryAbi, signer);

      const supplyInEther = ethers.parseEther(initialSupply);
      let tx;

      if (useFee && parseFloat(feePercentage) > 0) {
        // Convert fee from percentage to basis points (1% = 100 basis points)
        const feeBasisPoints = Math.floor(parseFloat(feePercentage) * 100);
        const feeRecipient = feeCollector || address;

        tx = await contract.createTokenWithFee(
          tokenName,
          tokenSymbol,
          supplyInEther,
          logoURL,
          feeBasisPoints,
          feeRecipient
        );
      } else {
        tx = await contract.createToken(
          tokenName,
          tokenSymbol,
          supplyInEther,
          logoURL
        );
      }

      setTransactionHash(tx.hash);
      const receipt = await tx.wait();
      
      // Find TokenCreated event to get the created token address
      const event = receipt.logs
        .filter((log: any) => log.topics[0] === ethers.id("TokenCreated(address,string,string,uint256,address)"))
        .map((log: any) => {
          const parsedLog = contract.interface.parseLog(log);
          return parsedLog?.args?.tokenAddress;
        })[0];
      
      if (event) {
        setCreatedTokenAddress(event);
      }
      
      // Reset form
      setTokenName("");
      setTokenSymbol("");
      setInitialSupply("1000");
      setLogoURL("");
      setFeePercentage("0");
      setFeeCollector("");
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create token");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!walletConnected) {
    return <p className="text-center p-4 bg-yellow-50 text-yellow-700 rounded">Please connect your wallet to create tokens</p>;
  }

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create New Token</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {transactionHash && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
          <p>Transaction submitted!</p>
          <a 
            href={`https://sepolia.tea.xyz/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View on Etherscan
          </a>
        </div>
      )}
      
      {createdTokenAddress && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md">
          <p>Token created successfully at:</p>
          <a 
            href={`https://sepolia.tea.xyz/address/${createdTokenAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-words"
          >
            {createdTokenAddress}
          </a>
        </div>
      )}

      <form onSubmit={createToken}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Token Name</label>
          <input 
            type="text" 
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            placeholder="My Token"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Token Symbol</label>
          <input 
            type="text" 
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            placeholder="MTK"
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Initial Supply</label>
          <input 
            type="text" 
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            placeholder="1000"
            value={initialSupply}
            onChange={(e) => setInitialSupply(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Logo URL</label>
          <input 
            type="url" 
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            placeholder="https://example.com/logo.png"
            value={logoURL}
            onChange={(e) => setLogoURL(e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              className="mr-2"
              checked={useFee}
              onChange={(e) => setUseFee(e.target.checked)}
            />
            <span className="text-sm font-medium">Enable Transfer Fee</span>
          </label>
        </div>
        
        {useFee && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Fee Percentage (%)</label>
              <input 
                type="number" 
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder="1.5"
                value={feePercentage}
                onChange={(e) => setFeePercentage(e.target.value)}
                step="0.01"
                min="0"
                max="10"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum 10%</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Fee Collector Address (optional)</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder="0x..."
                value={feeCollector}
                onChange={(e) => setFeeCollector(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to use your address</p>
            </div>
          </>
        )}
        
        <button 
          type="submit" 
          className={`w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Token'}
        </button>
      </form>
    </div>
  );
}
