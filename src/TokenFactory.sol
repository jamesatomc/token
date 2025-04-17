// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./Token.sol";

contract TokenFactory {
    // Event to notify when a new token is created
    event TokenCreated(address tokenAddress, string name, string symbol, uint256 initialSupply, address creator, address recipient);
    
    // Add new error events to help with debugging
    event TokenCreationError(string errorMessage, address tokenAddress);

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
     * @param recipient The address to receive the initial token supply (if zero address, tokens stay in factory)
     * @return The address of the newly created token
     */
    function createToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        string memory logoURL,
        address recipient
    ) public returns (address) {
        // Input validation
        require(bytes(name).length > 0, "Token name cannot be empty");
        require(bytes(symbol).length > 0, "Token symbol cannot be empty");
        require(initialSupply > 0, "Initial supply must be greater than zero");
        
        // Create a new Token contract
        Token newToken;
        try new Token(name, symbol, initialSupply, logoURL) returns (Token token) {
            newToken = token;
        } catch Error(string memory reason) {
            emit TokenCreationError(reason, address(0));
            revert(string(abi.encodePacked("Token creation failed: ", reason)));
        } catch (bytes memory) {
            emit TokenCreationError("Token creation failed with unknown error", address(0));
            revert("Token creation failed with unknown error");
        }
        
        address tokenAddress = address(newToken);
        
        // Check total supply (not just factory balance)
        uint256 totalSupply;
        try newToken.totalSupply() returns (uint256 supply) {
            totalSupply = supply;
            require(totalSupply > 0, "No tokens were minted");
        } catch Error(string memory reason) {
            emit TokenCreationError(reason, tokenAddress);
            revert(string(abi.encodePacked("Failed to get total supply: ", reason)));
        } catch (bytes memory) {
            emit TokenCreationError("Failed to get total supply with unknown error", tokenAddress);
            revert("Failed to get total supply with unknown error");
        }
        
        // Get the actual balance of the factory
        uint256 factoryBalance;
        try newToken.balanceOf(address(this)) returns (uint256 balance) {
            factoryBalance = balance;
        } catch Error(string memory reason) {
            emit TokenCreationError(reason, tokenAddress);
            revert(string(abi.encodePacked("Failed to get factory balance: ", reason)));
        } catch (bytes memory) {
            emit TokenCreationError("Failed to get factory balance with unknown error", tokenAddress);
            revert("Failed to get factory balance with unknown error");
        }
        
        // Transfer tokens to the recipient if specified, otherwise keep in factory
        if (recipient != address(0) && factoryBalance > 0) {
            bool transferSuccess = false;
            try newToken.transfer(recipient, factoryBalance) returns (bool success) {
                transferSuccess = success;
            } catch Error(string memory reason) {
                emit TokenCreationError(reason, tokenAddress);
                revert(string(abi.encodePacked("Token transfer to recipient failed: ", reason)));
            } catch (bytes memory) {
                emit TokenCreationError("Token transfer failed with unknown error", tokenAddress);
                revert("Token transfer failed with unknown error");
            }
            require(transferSuccess, "Token transfer to recipient returned false");
        }
        
        // Transfer ownership to the caller
        newToken.transferOwnership(msg.sender);
        
        // Record the new token
        createdTokens.push(tokenAddress);
        creatorTokens[msg.sender].push(tokenAddress);
        
        // Store token information
        tokenInfo[tokenAddress] = TokenInfo({
            name: name,
            symbol: symbol,
            creator: msg.sender,
            exists: true
        });
        
        // Emit event to notify frontend and blockchain explorers
        emit TokenCreated(tokenAddress, name, symbol, initialSupply, msg.sender, recipient);
        
        return tokenAddress;
    }
    
    /**
     * @dev Creates a new token with default recipient (caller)
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param initialSupply The initial supply (will be multiplied by 10^18)
     * @param logoURL The URL pointing to the token logo
     * @return The address of the newly created token
     */
    function createTokenWithSelf(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        string memory logoURL
    ) public returns (address) {
        return createToken(name, symbol, initialSupply, logoURL, msg.sender);
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
        address feeCollector,
        address recipient
    ) public returns (address) {
        // Create the basic token first
        address tokenAddress = createToken(name, symbol, initialSupply, logoURL, recipient);
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
     * @dev Creates a token with pre-configured fee settings and self as recipient
     */
    function createTokenWithFeeToSelf(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        string memory logoURL,
        uint256 feePercentage,
        address feeCollector
    ) public returns (address) {
        return createTokenWithFee(name, symbol, initialSupply, logoURL, feePercentage, feeCollector, msg.sender);
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
