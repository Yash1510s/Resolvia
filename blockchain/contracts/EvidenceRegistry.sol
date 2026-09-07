// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EvidenceRegistry
 * @notice Immutable ledger registry for evidence SHA-256 hashes and IPFS CIDs.
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

    event EvidenceRegistered(
        uint256 indexed evidenceId,
        uint256 indexed caseId,
        address indexed submitter,
        bytes32 contentSha256,
        string ipfsCid,
        AccessTier tier
    );

    function registerEvidence(
        uint256 _caseId,
        bytes32 _contentSha256,
        string calldata _ipfsCid,
        AccessTier _tier
    ) external returns (uint256) {
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
