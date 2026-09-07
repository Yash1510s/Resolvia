// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ResolviaToken.sol";
import "./CaseRegistry.sol";
import "./VotingManager.sol";
import "./EvidenceRegistry.sol";

/**
 * @title ArbitrationHub
 * @notice Master coordinator tying CaseRegistry, VotingManager, and Token staking together.
 */
contract ArbitrationHub {
    ResolviaToken public token;
    CaseRegistry public caseRegistry;
    VotingManager public votingManager;
    EvidenceRegistry public evidenceRegistry;

    address public admin;
    uint256 public constant REQUIRED_STAKE = 500 * 10 ** 18; // 500 RSLV
    uint256 public constant JUROR_PANEL_SIZE = 5;

    event DisputeInitiated(uint256 indexed caseId, string caseNumber, address indexed claimant, address indexed respondent);
    event StakeSettled(uint256 indexed caseId, address winner, uint256 payoutAmount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor(
        address _token,
        address _caseRegistry,
        address _votingManager,
        address _evidenceRegistry
    ) {
        admin = msg.sender;
        token = ResolviaToken(_token);
        caseRegistry = CaseRegistry(_caseRegistry);
        votingManager = VotingManager(_votingManager);
        evidenceRegistry = EvidenceRegistry(_evidenceRegistry);
    }

    function initiateDispute(
        string memory _caseNumber,
        address _respondent
    ) external returns (uint256) {
        // Escrow anti-spam stake
        require(token.transferFrom(msg.sender, address(this), REQUIRED_STAKE), "Stake transfer failed");

        uint256 caseId = caseRegistry.createCase(_caseNumber, msg.sender, _respondent, REQUIRED_STAKE);
        emit DisputeInitiated(caseId, _caseNumber, msg.sender, _respondent);
        return caseId;
    }

    function appointJurorPanel(uint256 _caseId, address[] memory _jurors) external onlyAdmin {
        require(_jurors.length == JUROR_PANEL_SIZE, "Panel must equal 5 jurors");
        votingManager.assignJurorPanel(_caseId, _jurors);
        caseRegistry.updateState(_caseId, CaseRegistry.CaseState.JURY_COMMIT);
    }

    function settleCase(uint256 _caseId) external onlyAdmin {
        (uint256 claimantVotes, uint256 respondentVotes, uint256 splitVotes, uint256 total) = votingManager.getTally(_caseId);
        require(total >= 3, "Threshold majority not reached");

        uint8 outcome = 3; // Split default
        if (claimantVotes > respondentVotes && claimantVotes > splitVotes) {
            outcome = 1;
        } else if (respondentVotes > claimantVotes && respondentVotes > splitVotes) {
            outcome = 2;
        }

        caseRegistry.finalizeVerdict(_caseId, outcome);
    }
}
