export const TEA_NETWORK = {
  chainId: '0x27EA', // 10218 in hex
  chainName: 'TEA Network Testnet',
  nativeCurrency: {
    name: 'TEA',
    symbol: 'TEA',
    decimals: 18
  },
  rpcUrls: ['https://tea-sepolia.g.alchemy.com/public'],
  blockExplorerUrls: ['https://sepolia.tea.xyz/']
};

export const addTeaNetworkToMetamask = async () => {
  if (!window.ethereum) return false;
  
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [TEA_NETWORK]
    });
    return true;
  } catch (error) {
    console.error('Error adding TEA Network to MetaMask:', error);
    return false;
  }
};

export const switchToTeaNetwork = async () => {
  if (!window.ethereum) return false;
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: TEA_NETWORK.chainId }]
    });
    return true;
  } catch (error) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      return await addTeaNetworkToMetamask();
    }
    console.error('Error switching to TEA Network:', error);
    return false;
  }
};
