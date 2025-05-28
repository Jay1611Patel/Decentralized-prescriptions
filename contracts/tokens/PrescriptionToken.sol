// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../interfaces/IPrescriptionToken.sol";

contract PrescriptionToken is ERC721, AccessControl, IPrescriptionToken {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    mapping(uint256 => bool) private _prescriptionTokens;
    string private _baseTokenURI;
    mapping(uint256 => string) private _tokenURIs;

    constructor(string memory baseURI) ERC721("PrescriptionToken", "PRSC") {
        _baseTokenURI = baseURI;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
    }

    function mint(
        address to,
        uint256 tokenId,
        string memory tokenURI
    ) external override onlyRole(MINTER_ROLE) {
        _mint(to, tokenId);
        _prescriptionTokens[tokenId] = true;
        _tokenURIs[tokenId] = tokenURI;
    }

    function burn(uint256 tokenId) external override onlyRole(BURNER_ROLE) {
        require(
            ownerOf(tokenId) == msg.sender ||
                getApproved(tokenId) == msg.sender ||
                isApprovedForAll(ownerOf(tokenId), msg.sender),
            "Not owner nor approved"
        );
        _burn(tokenId);
        delete _prescriptionTokens[tokenId];
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Nonexistent token");
        return _tokenURIs[tokenId];
    }

    function setBaseURI(
        string memory baseURI_
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseTokenURI = baseURI_;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function isPrescriptionToken(
        uint256 tokenId
    ) external view override returns (bool) {
        return _prescriptionTokens[tokenId];
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, IERC165, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public virtual override(ERC721, IERC721) {
        require(to == address(0), "Transfers disabled");
        super.safeTransferFrom(from, to, tokenId, data);
    }
}
