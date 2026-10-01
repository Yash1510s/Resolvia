// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CaseRegistry.sol";

/**
 * @title EvidenceRegistry
 * @notice Immutable ledger registry for evidence SHA-256 hashes and IPFS CIDs.
 *         Restricts submissions to authorized case parties (claimant/respondent/hub)
 *         and active dispute evidence states (SUBMITTED / EVIDENCE_LOCKED).
 */
contract EvidenceRegistry {
    enum AccessTier {
        PUBLIC,
        PARTY_ONLY,
        AUTHORIZED,
        RESTRICTED_PII
    }

    struct EvidenceRecord {
        uint256 evidenceId;
        uint256 caseId;
        address submitter;
        bytes32 contentSha256;
        string ipfsCid;
        AccessTier tier;
        uint256 submittedAt;
    }

    uint256 public evidenceCount;
    mapping(uint256 => EvidenceRecord) public evidences;
    mapping(uint256 => uint256[]) public caseEvidenceIds;

    address public owner;
    CaseRegistry public caseRegistry;
    address public arbitrationHub;

    event EvidenceRegistered(
        uint256 indexed evidenceId,
        uint256 indexed caseId,
        address indexed submitter,
        bytes32 contentSha256,
        string ipfsCid,
        AccessTier tier
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setCaseRegistry(address _caseRegistry) external onlyOwner {
        caseRegistry = CaseRegistry(_caseRegistry);
    }

    function setArbitrationHub(address _hub) external onlyOwner {
        arbitrationHub = _hub;
    }

    function registerEvidence(
        uint256 _caseId,
        bytes32 _contentSha256,
        string calldata _ipfsCid,
        AccessTier _tier
    ) external returns (uint256) {
        if (address(caseRegistry) != address(0)) {
            (
                ,
                ,
                address claimant,
                address respondent,
                ,
                CaseRegistry.CaseState state,
                ,
                ,
                ,
                ,
                ,
            ) = caseRegistry.cases(_caseId);
            require(
                msg.sender == claimant || msg.sender == respondent || msg.sender == arbitrationHub,
                "Unauthorized: only case parties or hub"
            );
            require(
                state == CaseRegistry.CaseState.SUBMITTED || state == CaseRegistry.CaseState.EVIDENCE_LOCKED,
                "Evidence window closed for this case"
            );
        }
        evidenceCount++;
        evidences[evidenceCount] = EvidenceRecord({
            evidenceId: evidenceCount,
            caseId: _caseId,
            submitter: msg.sender,
            contentSha256: _contentSha256,
            ipfsCid: _ipfsCid,
            tier: _tier,
            submittedAt: block.timestamp
        });

        caseEvidenceIds[_caseId].push(evidenceCount);

        emit EvidenceRegistered(
            evidenceCount,
            _caseId,
            msg.sender,
            _contentSha256,
            _ipfsCid,
            _tier
        );

        return evidenceCount;
    }

    function getCaseEvidence(uint256 _caseId) external view returns (uint256[] memory) {
        return caseEvidenceIds[_caseId];
    }
}
