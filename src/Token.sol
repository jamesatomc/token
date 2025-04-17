// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract Token is ERC20, Ownable, ERC20Burnable {
    uint256 public transferFeePercentage = 0; // in basis points (1% = 100)
    address public feeCollector;
    mapping(address => bool) public isExemptFromFee;
    string public logoURL;

    // Event for tracking token burns
    event TokensBurned(address indexed burner, uint256 amount, string reason);
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        string memory initialLogoURL
    ) ERC20(name, symbol) {
        // Create tokens with 18 decimals based on specified supply and mint to contract creator (factory)
        uint256 mintAmount = initialSupply * 10**decimals();
        _mint(msg.sender, mintAmount);
        logoURL = initialLogoURL;
        feeCollector = msg.sender;
        isExemptFromFee[msg.sender] = true; // Owner is exempt from fees
        // Note: ownership will be transferred to actual user by factory later
    }
    
    // Add mint function for the owner to create more tokens
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    function setTransferFeePercentage(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 1000, "Fee cannot exceed 10%");
        transferFeePercentage = newFeePercentage;
    }
    
    function setFeeCollector(address newFeeCollector) external onlyOwner {
        require(newFeeCollector != address(0), "Cannot set fee collector to zero address");
        feeCollector = newFeeCollector;
    }
    
    function setFeeExemption(address account, bool exempt) external onlyOwner {
        isExemptFromFee[account] = exempt;
    }
    
    /**
     * @dev Updates the token logo URL
     * @param newLogoURL The new URL pointing to the token logo
     */
    function updateLogoURL(string calldata newLogoURL) external onlyOwner {
        logoURL = newLogoURL;
    }
    
    /**
     * @dev Burns tokens with an optional reason
     * @param amount The amount of tokens to burn
     * @param reason Optional reason for the burn
     */
    function burnWithReason(uint256 amount, string memory reason) external {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount, reason);
    }
    
    /**
     * @dev Owner can burn tokens from any address
     * @param from The address to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burnFrom(address from, uint256 amount) public override onlyOwner {
        _burn(from, amount);
        emit TokensBurned(from, amount, "Owner initiated burn");
    }
    
    /**
     * @dev Batch burn tokens from multiple addresses
     * @param accounts Array of addresses to burn from
     * @param amounts Array of amounts to burn
     */
    function batchBurn(address[] calldata accounts, uint256[] calldata amounts) external onlyOwner {
        require(accounts.length == amounts.length, "Arrays must have same length");
        
        for (uint256 i = 0; i < accounts.length; i++) {
            _burn(accounts[i], amounts[i]);
            emit TokensBurned(accounts[i], amounts[i], "Batch burn");
        }
    }
    
    function _transfer(address sender, address recipient, uint256 amount) internal virtual override {
        if (transferFeePercentage == 0 || isExemptFromFee[sender] || isExemptFromFee[recipient]) {
            super._transfer(sender, recipient, amount);
        } else {
            uint256 feeAmount = (amount * transferFeePercentage) / 10000;
            uint256 transferAmount = amount - feeAmount;
            
            super._transfer(sender, feeCollector, feeAmount);
            super._transfer(sender, recipient, transferAmount);
        }
    }

    // Add a function to check if an address has tokens
    function hasTokens(address account) external view returns (bool) {
        return balanceOf(account) > 0;
    }
}