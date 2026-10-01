// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VotingManager
 * @notice Production commit-reveal voting contract ensuring juror anti-collusion.
 */
contract VotingManager {
    enum VoteChoice {
        NONE,
        CLAIMANT_UPHELD,
        RESPONDENT_UPHELD,
        SPLIT_SETTLEMENT
    }

    struct VoteCommitment {
        bytes32 commitmentHash;
        bool committed;
        bool revealed;
        VoteChoice revealedChoice;
        uint256 commitTimestamp;
        uint256 revealTimestamp;
    }

    struct CaseTally {
        uint256 claimantVotes;
        uint256 respondentVotes;
        uint256 splitVotes;
        uint256 totalRevealed;
    }

    // caseId => jurorAddress => commitment
    mapping(uint256 => mapping(address => VoteCommitment)) public jurorVotes;
    // caseId => jurorAddress => isPanelMember
    mapping(uint256 => mapping(address => bool)) public isPanelJuror;
    // caseId => CaseTally
    mapping(uint256 => CaseTally) public caseTallies;

    address public arbitrationHub;
    uint256 public constant REVEAL_GRACE = 1 days;

    // caseId => voting deadline (commit window closes here; reveal allowed +1 day grace)
    mapping(uint256 => uint256) public votingDeadlines;

    event VoteCommitted(uint256 indexed caseId, address indexed juror, bytes32 commitmentHash);
    event VoteRevealed(uint256 indexed caseId, address indexed juror, VoteChoice choice);
    event PanelAssigned(uint256 indexed caseId, address[] jurors, uint256 votingDeadline);

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

    function assignJurorPanel(
        uint256 _caseId,
        address[] memory _jurors,
        uint256 _votingDeadline
    ) external onlyHub {
        for (uint256 i = 0; i < _jurors.length; i++) {
            isPanelJuror[_caseId][_jurors[i]] = true;
        }
        votingDeadlines[_caseId] = _votingDeadline;
        emit PanelAssigned(_caseId, _jurors, _votingDeadline);
    }

    /**
     * @notice Submit blind cryptographic commitment: keccak256(abi.encodePacked(voteChoice, salt))
     */
    function commitVote(uint256 _caseId, bytes32 _commitmentHash) external {
        require(isPanelJuror[_caseId][msg.sender], "Not an assigned juror");
        require(block.timestamp <= votingDeadlines[_caseId], "Commit window closed");
        VoteCommitment storage v = jurorVotes[_caseId][msg.sender];
        require(!v.committed, "Already committed");

        v.commitmentHash = _commitmentHash;
        v.committed = true;
        v.commitTimestamp = block.timestamp;

        emit VoteCommitted(_caseId, msg.sender, _commitmentHash);
    }

    /**
     * @notice Reveal vote choice using secret salt
     */
    function revealVote(uint256 _caseId, uint8 _voteChoice, bytes32 _salt) external {
        require(isPanelJuror[_caseId][msg.sender], "Not an assigned juror");
        VoteCommitment storage v = jurorVotes[_caseId][msg.sender];
        require(v.committed, "No commitment found");
        require(!v.revealed, "Already revealed");
        require(_voteChoice >= 1 && _voteChoice <= 3, "Invalid vote choice");
        require(
            block.timestamp > votingDeadlines[_caseId],
            "Commit window still open"
        );
        require(
            block.timestamp <= votingDeadlines[_caseId] + REVEAL_GRACE,
            "Reveal window closed"
        );

        // Verify cryptographic commitment matches revealed vote + salt,
        // bound to this case and this juror (replay-proof).
        bytes32 computedHash = keccak256(
            abi.encodePacked(uint8(_voteChoice), _salt, _caseId, msg.sender)
        );
        require(computedHash == v.commitmentHash, "Cryptographic commitment mismatch");

        v.revealed = true;
        v.revealedChoice = VoteChoice(_voteChoice);
        v.revealTimestamp = block.timestamp;

        CaseTally storage tally = caseTallies[_caseId];
        tally.totalRevealed++;
        if (_voteChoice == 1) tally.claimantVotes++;
        else if (_voteChoice == 2) tally.respondentVotes++;
        else if (_voteChoice == 3) tally.splitVotes++;

        emit VoteRevealed(_caseId, msg.sender, VoteChoice(_voteChoice));
    }

    function hasRevealed(uint256 _caseId, address _juror) external view returns (bool) {
        return jurorVotes[_caseId][_juror].revealed;
    }

    function getTally(uint256 _caseId) external view returns (uint256 claimant, uint256 respondent, uint256 split, uint256 total) {
        CaseTally storage t = caseTallies[_caseId];
        return (t.claimantVotes, t.respondentVotes, t.splitVotes, t.totalRevealed);
    }
}
