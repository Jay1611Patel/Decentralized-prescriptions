// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IPrescriptionToken is IERC721 {
    function mint(
        address to,
        uint256 tokenId,
        string calldata tokenURI
    ) external;

    function burn(uint256 tokenId) external;

    function isPrescriptionToken(uint256 tokenId) external view returns (bool);

    function setBaseURI(string calldata baseURI) external;

    function getBaseURI() external view returns (string memory);
}
