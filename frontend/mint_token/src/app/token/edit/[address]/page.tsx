"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const WalletConnect = dynamic(() => import('../../../components/WalletConnect'), { ssr: false });
const TokenEditor = dynamic(() => import('../../../components/TokenEditor'), { ssr: false });

interface TokenEditPageProps {
  params: {
    address: string;
  };
}

const TokenEditPage = ({ params }: TokenEditPageProps) => {
  const router = useRouter();
  const [tokenAddress, setTokenAddress] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (params?.address) {
      setTokenAddress(params.address);
    }
  }, [params]);

  const handleWalletConnect = (connected: boolean, walletAddress: string) => {
    setWalletConnected(connected);
    setAddress(walletAddress);
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
          <h1 className="text-3xl font-bold mb-4">Edit Token</h1>
          <WalletConnect />
        </header>
        
        {tokenAddress && (
          <TokenEditor 
            tokenAddress={tokenAddress} 
            walletConnected={walletConnected} 
            address={address} 
          />
        )}
      </div>
    </div>
  );
};

export default TokenEditPage;
