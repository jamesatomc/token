// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "../lib/openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/utils/Base64.sol";
import "../lib/openzeppelin-contracts/contracts/utils/Strings.sol";

contract KariNFT is ERC721URIStorage, Ownable {
    using Strings for uint256;
    
    uint256 private _tokenIdCounter;
    string private _imageURL = "https://avatars.githubusercontent.com/u/127471673?s=96&v=4";
    
    event NFTMinted(address indexed to, uint256 indexed tokenId);
    
    constructor() ERC721("KariNFT", "KNFT") {
        _transferOwnership(msg.sender);
    }
    
    function mint(address to) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _generateTokenURI(tokenId));
        
        emit NFTMinted(to, tokenId);
        return tokenId;
    }
    
    function batchMint(address to, uint256 amount) public onlyOwner returns (uint256[] memory) {
        uint256[] memory tokenIds = new uint256[](amount);
        
        for (uint256 i = 0; i < amount; i++) {
            tokenIds[i] = mint(to);
        }
        
        return tokenIds;
    }
    
    function mint100NFTs(address to) public onlyOwner returns (uint256[] memory) {
        return batchMint(to, 100);
    }
    
    function getTokenURI(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return tokenURI(tokenId);
    }
    
    function _generateTokenURI(uint256 tokenId) private view returns (string memory) {
        bytes memory metadata = abi.encodePacked(
            '{',
            '"name": "Kari NFT #', tokenId.toString(), '",',
            '"description": "A collectible Kari NFT token",',
            '"image": "', _imageURL, '"',
            '}'
        );
        
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(metadata)
            )
        );
    }
    
    function updateImageURL(string memory newImageURL) public onlyOwner {
        _imageURL = newImageURL;
    }
    
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
}
