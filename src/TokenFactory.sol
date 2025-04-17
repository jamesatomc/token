// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./Token.sol";

contract TokenFactory {
    // Event to notify when a new token is created
    event TokenCreated(address tokenAddress, string name, string symbol, uint256 initialSupply, address creator);
    
    // Array to store all created tokens
    address[] public createdTokens;
    
    // Mapping from creator to their tokens
    mapping(address => address[]) public creatorTokens;
    
    // Mapping to store token metadata
    struct TokenInfo {
        string name;
        string symbol;
        address creator;
        bool exists;
    }
    
    mapping(address => TokenInfo) public tokenInfo;
    
    /**
     * @dev Creates a new token with specified parameters
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param initialSupply The initial supply (will be multiplied by 10^18)
     * @param logoURL The URL pointing to the token logo
     * @return The address of the newly created token
     */
    function createToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        string memory logoURL
    ) external returns (address) {
        // Create a new Token contract
        Token newToken = new Token(name, symbol, initialSupply, logoURL);
        
        // Transfer all initial tokens to the caller
        uint256 totalSupply = newToken.balanceOf(address(this));
        require(totalSupply > 0, "No tokens were minted");
        newToken.transfer(msg.sender, totalSupply);
        
        // Transfer ownership to the caller
        newToken.transferOwnership(msg.sender);
        
        // Record the new token
        address tokenAddress = address(newToken);
        createdTokens.push(tokenAddress);
        creatorTokens[msg.sender].push(tokenAddress);
        
        // Store token information
        tokenInfo[tokenAddress] = TokenInfo({
            name: name,
            symbol: symbol,
            creator: msg.sender,
            exists: true
        });
        
        // Emit the event
        emit TokenCreated(tokenAddress, name, symbol, initialSupply, msg.sender);
        
        return tokenAddress;
    }
    
    /**
     * @dev Creates a token with pre-configured fee settings
     */
    function createTokenWithFee(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        string memory logoURL,
        uint256 feePercentage,
        address feeCollector
    ) external returns (address) {
        // Create the basic token first
        address tokenAddress = this.createToken(name, symbol, initialSupply, logoURL);
        Token token = Token(tokenAddress);
        
        // Configure the fee settings
        if (feePercentage > 0) {
            token.setTransferFeePercentage(feePercentage);
            if (feeCollector != address(0)) {
                token.setFeeCollector(feeCollector);
            }
        }
        
        return tokenAddress;
    }
    
    /**
     * @dev Returns the number of tokens created by this factory
     */
    function getTokenCount() external view returns (uint256) {
        return createdTokens.length;
    }
    
    /**
     * @dev Returns the tokens created by a specific address
     * @param creator The address of the token creator
     */
    function getTokensByCreator(address creator) external view returns (address[] memory) {
        return creatorTokens[creator];
    }
    
    /**
     * @dev Checks if a token was created by this factory
     * @param tokenAddress The address to check
     */
    function isTokenFromFactory(address tokenAddress) external view returns (bool) {
        return tokenInfo[tokenAddress].exists;
    }
    
    /**
     * @dev Get tokens with pagination
     * @param start The starting index
     * @param limit Maximum number of tokens to return
     */
    function getTokensPaginated(uint256 start, uint256 limit) external view returns (address[] memory) {
        uint256 tokenCount = createdTokens.length;
        
        if (start >= tokenCount) {
            return new address[](0);
        }
        
        uint256 end = start + limit;
        if (end > tokenCount) {
            end = tokenCount;
        }
        
        uint256 resultSize = end - start;
        address[] memory result = new address[](resultSize);
        
        for (uint256 i = 0; i < resultSize; i++) {
            result[i] = createdTokens[start + i];
        }
        
        return result;
    }
}
