// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CaseRegistry
 * @notice Authoritative on-chain registry for dispute state machine and case metadata.
 */
contract CaseRegistry {
    enum CaseState {
        DRAFT,
        SUBMITTED,
        RESPONDENT_WINDOW,
        EVIDENCE_LOCKED,
        AI_ANALYSIS,
        JURY_COMMIT,
        JURY_REVEAL,
        VERDICT,
        APPEAL_WINDOW,
        FINALIZED,
        CLOSED
    }

    struct CaseRecord {
        uint256 caseId;
        string caseNumber;
        address claimant;
        address respondent;
        uint256 antiSpamStake;
        CaseState state;
        bytes32 evidenceMerkleRoot;
        bytes32 aiReportHash;
        uint256 createdAt;
        uint256 responseDeadline;
        uint256 votingDeadline;
        uint8 winningOutcome; // 1 = Claimant, 2 = Respondent, 3 = Split
    }

    uint256 public caseCount;
    mapping(uint256 => CaseRecord) public cases;
    address public arbitrationHub;

    event CaseCreated(uint256 indexed caseId, string caseNumber, address indexed claimant, address indexed respondent);
    event CaseStateChanged(uint256 indexed caseId, CaseState newState);
    event EvidenceMerkleAnchored(uint256 indexed caseId, bytes32 merkleRoot);
    event AIReportAnchored(uint256 indexed caseId, bytes32 reportHash);
    event VerdictFinalized(uint256 indexed caseId, uint8 winningOutcome);

    modifier onlyHub() {
        require(msg.sender == arbitrationHub, "Only ArbitrationHub");
        _;
    }

    constructor() {
        arbitrationHub = msg.sender;
    }

    function setArbitrationHub(address _hub) external {
        require(arbitrationHub == msg.sender, "Unauthorized");
        arbitrationHub = _hub;
    }

    function createCase(
        string memory _caseNumber,
        address _claimant,
        address _respondent,
        uint256 _stake
    ) external onlyHub returns (uint256) {
        caseCount++;
        cases[caseCount] = CaseRecord({
            caseId: caseCount,
            caseNumber: _caseNumber,
            claimant: _claimant,
            respondent: _respondent,
            antiSpamStake: _stake,
            state: CaseState.SUBMITTED,
            evidenceMerkleRoot: bytes32(0),
            aiReportHash: bytes32(0),
            createdAt: block.timestamp,
            responseDeadline: block.timestamp + 2 days,
            votingDeadline: block.timestamp + 7 days,
            winningOutcome: 0
        });

        emit CaseCreated(caseCount, _caseNumber, _claimant, _respondent);
        return caseCount;
    }

    function updateState(uint256 _caseId, CaseState _newState) external onlyHub {
        cases[_caseId].state = _newState;
        emit CaseStateChanged(_caseId, _newState);
    }

    function anchorEvidence(uint256 _caseId, bytes32 _merkleRoot) external onlyHub {
        cases[_caseId].evidenceMerkleRoot = _merkleRoot;
        emit EvidenceMerkleAnchored(_caseId, _merkleRoot);
    }

    function anchorAIReport(uint256 _caseId, bytes32 _reportHash) external onlyHub {
        cases[_caseId].aiReportHash = _reportHash;
        emit AIReportAnchored(_caseId, _reportHash);
    }

    function finalizeVerdict(uint256 _caseId, uint8 _outcome) external onlyHub {
        cases[_caseId].winningOutcome = _outcome;
        cases[_caseId].state = CaseState.FINALIZED;
        emit VerdictFinalized(_caseId, _outcome);
    }
}
