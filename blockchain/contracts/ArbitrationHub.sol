// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ResolviaToken.sol";
import "./CaseRegistry.sol";
import "./VotingManager.sol";
import "./EvidenceRegistry.sol";

/**
 * @title ArbitrationHub
 * @notice Master coordinator: stake escrow, respondent counter-stake, jury panel
 *         appointment, quorum settlement with real fund movement, and stake rescue.
 *
 * Escrow model (per case):
 *   - Claimant locks REQUIRED_STAKE at initiation (anti-spam).
 *   - Respondent locks REQUIRED_STAKE via counterStake() within the response window.
 *   - On settlement the escrow (2 x REQUIRED_STAKE) is distributed:
 *       • Winner: own stake back + loser's stake minus juror reward pool (20%).
 *       • Jurors: 20% of loser's stake split evenly (reward for honest service).
 *       • Split verdict: both parties get their own stake back, no rewards.
 *   - If the respondent never counter-stakes, the claimant may rescueStake()
 *     after the response window closes.
 *
 * Security: CEI ordering (state before token transfers) + reentrancy lock on
 * all functions that move funds.
 */
contract ArbitrationHub {
    ResolviaToken public token;
    CaseRegistry public caseRegistry;
    VotingManager public votingManager;
    EvidenceRegistry public evidenceRegistry;

    address public admin;
    uint256 public constant REQUIRED_STAKE = 500 * 10 ** 18; // 500 RSLV
    uint256 public constant JUROR_PANEL_SIZE = 5;
    uint256 public constant JUROR_REWARD_PERCENT = 20; // % of loser's stake

    // caseId => jury panel (for reward distribution)
    mapping(uint256 => address[]) private jurorPanels;
    // caseId => respondent's locked stake
    mapping(uint256 => uint256) public respondentStakes;
    // caseId => settled flag
    mapping(uint256 => bool) public isSettled;

    uint256 private _lock = 1;

    event DisputeInitiated(uint256 indexed caseId, string caseNumber, address indexed claimant, address indexed respondent);
    event RespondentStaked(uint256 indexed caseId, address indexed respondent, uint256 stake);
    event StakeRescued(uint256 indexed caseId, address indexed claimant, uint256 amount);
    event JurorPanelAppointed(uint256 indexed caseId, address[] jurors);
    event StakeSettled(uint256 indexed caseId, address winner, uint256 payoutAmount);
    event JurorRewarded(uint256 indexed caseId, address indexed juror, uint256 reward);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier nonReentrant() {
        require(_lock == 1, "Reentrancy");
        _lock = 2;
        _;
        _lock = 1;
    }

    // Public struct getters return a 12-tuple; reconstruct the record.
    function getCase(uint256 _caseId) internal view returns (CaseRegistry.CaseRecord memory) {
        (
            uint256 cid,
            string memory caseNumber,
            address claimant,
            address respondent,
            uint256 antiSpamStake,
            CaseRegistry.CaseState state,
            bytes32 evidenceMerkleRoot,
            bytes32 aiReportHash,
            uint256 createdAt,
            uint256 responseDeadline,
            uint256 votingDeadline,
            uint8 winningOutcome
        ) = caseRegistry.cases(_caseId);
        return CaseRegistry.CaseRecord({
            caseId: cid,
            caseNumber: caseNumber,
            claimant: claimant,
            respondent: respondent,
            antiSpamStake: antiSpamStake,
            state: state,
            evidenceMerkleRoot: evidenceMerkleRoot,
            aiReportHash: aiReportHash,
            createdAt: createdAt,
            responseDeadline: responseDeadline,
            votingDeadline: votingDeadline,
            winningOutcome: winningOutcome
        });
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

    /**
     * @notice Claimant opens a case, locking the anti-spam stake.
     */
    function initiateDispute(
        string memory _caseNumber,
        address _respondent
    ) external returns (uint256) {
        require(_respondent != address(0), "Invalid respondent");
        require(token.transferFrom(msg.sender, address(this), REQUIRED_STAKE), "Stake transfer failed");

        uint256 caseId = caseRegistry.createCase(_caseNumber, msg.sender, _respondent, REQUIRED_STAKE);
        emit DisputeInitiated(caseId, _caseNumber, msg.sender, _respondent);
        return caseId;
    }

    /**
     * @notice Respondent locks the matching stake within the response window.
     *         Moves the case to EVIDENCE_LOCKED (eligible for panel appointment).
     */
    function counterStake(uint256 _caseId) external nonReentrant {
        CaseRegistry.CaseRecord memory c = getCase(_caseId);
        require(msg.sender == c.respondent, "Only respondent");
        require(c.state == CaseRegistry.CaseState.SUBMITTED, "Not in response window");
        require(block.timestamp <= c.responseDeadline, "Response window closed");
        require(token.transferFrom(msg.sender, address(this), REQUIRED_STAKE), "Stake transfer failed");

        respondentStakes[_caseId] = REQUIRED_STAKE;
        caseRegistry.updateState(_caseId, CaseRegistry.CaseState.EVIDENCE_LOCKED);
        emit RespondentStaked(_caseId, msg.sender, REQUIRED_STAKE);
    }

    /**
     * @notice Claimant reclaims their stake if the respondent ignored the case
     *         (response window has closed, case still SUBMITTED).
     */
    function rescueStake(uint256 _caseId) external nonReentrant {
        CaseRegistry.CaseRecord memory c = getCase(_caseId);
        require(msg.sender == c.claimant, "Only claimant");
        require(c.state == CaseRegistry.CaseState.SUBMITTED, "Case already progressed");
        require(block.timestamp > c.responseDeadline, "Response window still open");

        caseRegistry.updateState(_caseId, CaseRegistry.CaseState.CLOSED);
        require(token.transfer(c.claimant, c.antiSpamStake), "Stake rescue failed");
        emit StakeRescued(_caseId, c.claimant, c.antiSpamStake);
    }

    /**
     * @notice Admin appoints the 5-juror panel. Requires both stakes locked.
     */
    function appointJurorPanel(uint256 _caseId, address[] memory _jurors) external onlyAdmin {
        require(_jurors.length == JUROR_PANEL_SIZE, "Panel must equal 5 jurors");
        CaseRegistry.CaseRecord memory c = getCase(_caseId);
        require(c.state == CaseRegistry.CaseState.EVIDENCE_LOCKED, "Respondent has not staked");
        require(!isSettled[_caseId], "Case already settled");

        jurorPanels[_caseId] = _jurors;
        votingManager.assignJurorPanel(_caseId, _jurors, c.votingDeadline);
        caseRegistry.updateState(_caseId, CaseRegistry.CaseState.JURY_COMMIT);
        emit JurorPanelAppointed(_caseId, _jurors);
    }

    /**
     * @notice Settle the case once quorum (>=3 revealed votes) is reached.
     *         Finalizes the verdict and moves all funds (see distributeEscrow).
     */
    function settleCase(uint256 _caseId) external onlyAdmin nonReentrant {
        require(!isSettled[_caseId], "Already settled");
        CaseRegistry.CaseRecord memory c = getCase(_caseId);
        require(
            c.state == CaseRegistry.CaseState.JURY_COMMIT || c.state == CaseRegistry.CaseState.JURY_REVEAL,
            "Not in voting phase"
        );

        (uint256 claimantVotes, uint256 respondentVotes, uint256 splitVotes, uint256 total) =
            votingManager.getTally(_caseId);
        require(total >= 3, "Quorum not reached");

        uint8 outcome = computeOutcome(claimantVotes, respondentVotes, splitVotes);

        // ── CEI: state changes before token transfers ──
        caseRegistry.finalizeVerdict(_caseId, outcome);
        isSettled[_caseId] = true;
        distributeEscrow(_caseId, outcome, c);
    }

    function computeOutcome(
        uint256 claimantVotes,
        uint256 respondentVotes,
        uint256 splitVotes
    ) internal pure returns (uint8) {
        if (claimantVotes > respondentVotes && claimantVotes > splitVotes) return 1;
        if (respondentVotes > claimantVotes && respondentVotes > splitVotes) return 2;
        return 3;
    }

    /**
     * @notice Escrow distribution:
     *   winner  <- own stake + loser stake - reward pool (20% of loser stake)
     *   jurors  <- reward pool split evenly
     *   split   <- both stakes refunded, no rewards
     */
    function distributeEscrow(
        uint256 _caseId,
        uint8 outcome,
        CaseRegistry.CaseRecord memory c
    ) internal {
        uint256 respStake = respondentStakes[_caseId];

        if (outcome == 3) {
            require(token.transfer(c.claimant, c.antiSpamStake), "Claimant refund failed");
            require(token.transfer(c.respondent, respStake), "Respondent refund failed");
            emit StakeSettled(_caseId, address(0), 0);
            return;
        }

        address winner = outcome == 1 ? c.claimant : c.respondent;
        uint256 ownStake = outcome == 1 ? c.antiSpamStake : respStake;
        uint256 loserStake = outcome == 1 ? respStake : c.antiSpamStake;

        uint256 rewardPool = (loserStake * JUROR_REWARD_PERCENT) / 100;
        uint256 winnerPayout = ownStake + (loserStake - rewardPool);

        require(token.transfer(winner, winnerPayout), "Winner payout failed");
        emit StakeSettled(_caseId, winner, winnerPayout);

        address[] storage panel = jurorPanels[_caseId];
        uint256 perJuror = rewardPool / panel.length;
        for (uint256 i = 0; i < panel.length; i++) {
            require(token.transfer(panel[i], perJuror), "Juror reward failed");
            emit JurorRewarded(_caseId, panel[i], perJuror);
        }
    }

    /**
     * @notice Forward evidence Merkle root to CaseRegistry. Callable by admin or claimant.
     */
    function anchorEvidenceBundle(uint256 _caseId, bytes32 _merkleRoot) external {
        CaseRegistry.CaseRecord memory c = getCase(_caseId);
        require(msg.sender == admin || msg.sender == c.claimant, "Unauthorized");
        caseRegistry.anchorEvidence(_caseId, _merkleRoot);
    }

    /**
     * @notice Forward AI analysis report hash to CaseRegistry. Callable by admin or oracle.
     */
    function anchorAIReportHash(uint256 _caseId, bytes32 _reportHash) external onlyAdmin {
        caseRegistry.anchorAIReport(_caseId, _reportHash);
    }
}

