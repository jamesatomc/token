// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";

contract Token is ERC20, Ownable {
    uint256 public transferFeePercentage = 0; // in basis points (1% = 100)
    address public feeCollector;
    mapping(address => bool) public isExemptFromFee;
    string public logoURL = "https://avatars.githubusercontent.com/u/127471673?s=96&v=4";
    
    constructor() ERC20("kari", "KARI") {
        // Create 10 million tokens with 18 decimals
        // 10,000,000 * 10^18
        _mint(msg.sender, 10_000_000 * 10**decimals());
        feeCollector = msg.sender;
        isExemptFromFee[msg.sender] = true; // Owner is exempt from fees
        _transferOwnership(msg.sender); // Set the owner properly
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
}