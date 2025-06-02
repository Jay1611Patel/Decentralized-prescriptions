// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IPrescriptionToken is IERC721 {
    /**
     * @dev Mints a new prescription NFT
     * @param to The patient address receiving the prescription
     * @param tokenId The unique prescription ID
     * @param tokenURI The metadata URI (relative to base URI)
     */
    function mint(
        address to,
        uint256 tokenId,
        string calldata tokenURI
    ) external;

    /**
     * @dev Burns a fulfilled prescription
     * @param tokenId The prescription ID to burn
     */
    function burn(uint256 tokenId) external;

    /**
     * @dev Checks if a token represents a valid prescription
     * @param tokenId The token ID to verify
     * @return bool True if valid prescription
     */
    function isPrescriptionToken(uint256 tokenId) external returns (bool);

    /**
     * @dev Updates the base URI for all tokens
     * @param baseURI The new base URI
     */
    function setBaseURI(string calldata baseURI) external;

    /**
     * @dev Returns the base URI
     */
    function getBaseURI() external view returns (string memory);
}
