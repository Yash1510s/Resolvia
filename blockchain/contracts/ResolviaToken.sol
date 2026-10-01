// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ResolviaToken (RSLV)
 * @notice Audited ERC-20 utility token for dispute deposits, juror staking, and settlement rewards.
 *         Includes a public testnet faucet for real-user onboarding and a hard supply cap.
 */
contract ResolviaToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10 ** 18; // 100 Million RSLV cap
    uint256 public constant FAUCET_AMOUNT = 1_000 * 10 ** 18;    // 1,000 RSLV per claim
    uint256 public constant FAUCET_COOLDOWN = 1 days;

    // user => last faucet claim timestamp
    mapping(address => uint256) public lastFaucetClaim;

    event FaucetClaimed(address indexed user, uint256 amount);

    constructor() ERC20("Resolvia Token", "RSLV") Ownable(msg.sender) {
        // Initial supply of 10 Million RSLV minted to deployer
        _mint(msg.sender, 10_000_000 * 10 ** decimals());
    }

    /**
     * @notice Public testnet faucet allowing real users to self-fund stakes without admin intervention.
     */
    function claimTestnetTokens() external {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN,
            "Faucet cooldown active: wait 24 hours"
        );
        require(totalSupply() + FAUCET_AMOUNT <= MAX_SUPPLY, "Max supply exceeded");

        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }

    /**
     * @notice Admin mint subject to hard cap.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
    }
}

