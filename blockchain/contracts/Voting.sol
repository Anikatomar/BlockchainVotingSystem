// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract Voting {
    address public admin;

    struct Candidate {
    uint id;
    string name;
    uint voteCount;
    }
    enum ElectionState {
    NOT_STARTED,
    ACTIVE,
    ENDED,
    CANCELLED
    }

    struct Election {
        uint id;
        string name;
        uint startTime;
        uint endTime;
        uint totalVotes;
        ElectionState state;
    }
    struct Proposal {
        uint electionId;
        uint approvalCount;
        bool executed;
        bool exists;
        mapping(address => bool) approved;
    }
    mapping(uint => Proposal) private proposals;

    uint public proposalCount;

    event ElectionCreated(uint indexed electionId, string name);
    event ChangeProposed(uint indexed proposalId, uint indexed electionId, address proposedBy);
    event ChangeApproved(uint indexed proposalId, address approvedBy);
    event ElectionCancelled(uint indexed electionId);
    event ElectionFinalized(uint indexed electionId, uint totalVotes);

    modifier onlyOfficial() {
        bool authorized = false;

        for (uint i = 0; i < officials.length; i++) {
            if (msg.sender == officials[i]) {
                authorized = true;
                break;
            }
        }

        require(authorized, "Not an authorized official");
        _;
    }
    mapping(uint => Election) public elections;

    mapping(uint => mapping(uint => Candidate))
        public candidates;

    mapping(uint => uint) public candidateCount;

    mapping(uint => mapping(address => bool))
        public hasVoted;

    uint public electionCount;
    address[] public officials;

    uint public constant REQUIRED_APPROVALS = 2;

    constructor(address[] memory _officials) {
        require(_officials.length == 3, "Exactly 3 officials required");

        admin = msg.sender;

        for (uint i = 0; i < _officials.length; i++) {
            require(_officials[i] != address(0), "Invalid official");

            for (uint j = 0; j < i; j++) {
                require(_officials[i] != _officials[j], "Duplicate official");
            }

            officials.push(_officials[i]);
        }
    }
    event CandidateAdded(
    uint indexed electionId,
    uint indexed candidateId,
    string name
    );
    event ElectionStarted(
    uint indexed electionId,
    uint timestamp
    );
    modifier onlyAdmin() {
    require(
        msg.sender == admin,
        "Only admin can perform this action"
    );
    _;
    }
    event VoteCast(
    uint indexed electionId,
    address indexed voter,
    uint indexed candidateId,
    uint totalVotes,
    uint timestamp
    );
       
    function addCandidate(
    uint electionId,
    string memory _name
    ) public onlyAdmin {
        require(
            elections[electionId].id != 0,
            "Election does not exist"
        );

        require(
            elections[electionId].state == ElectionState.NOT_STARTED,
            "Election configuration is frozen"
        );

        require(bytes(_name).length > 0, "Empty candidate name");

        candidateCount[electionId]++;

        uint id = candidateCount[electionId];

        candidates[electionId][id] =
            Candidate(id, _name, 0);

        emit CandidateAdded(electionId, id, _name);
    }
    function getCurrentLeader(uint _electionId)
    public
    view
    returns (uint, string memory, uint)
    {
        require(_electionId > 0 && _electionId <= electionCount,
            "Election does not exist");

        uint count = candidateCount[_electionId];

        require(count > 0, "No candidates available");

        uint leaderId = 1;

        for (uint i = 2; i <= count; i++) {
            if (
                candidates[_electionId][i].voteCount >
                candidates[_electionId][leaderId].voteCount
            ) {
                leaderId = i;
            }
        }

        Candidate memory leader = candidates[_electionId][leaderId];

        return (leader.id, leader.name, leader.voteCount);
    }
    function getAllCandidates(uint _electionId)
    public
    view
    returns (Candidate[] memory)
    {
    require(_electionId > 0 && _electionId <= electionCount,
        "Election does not exist");

    uint count = candidateCount[_electionId];

    Candidate[] memory allCandidates = new Candidate[](count);

    for (uint i = 1; i <= count; i++) {
        allCandidates[i - 1] = candidates[_electionId][i];
    }

    return allCandidates;
    }
    function getElectionStatus(uint electionId)
    public
    view
    returns (ElectionState)
    {
    require(
        elections[electionId].id != 0,
        "Election does not exist"
    );

    return elections[electionId].state;
    }
    function startElection(uint electionId) public onlyAdmin {
        Election storage e = elections[electionId];

        require(e.id != 0, "Election does not exist");
        require(e.state == ElectionState.NOT_STARTED, "Invalid state");
        require(candidateCount[electionId] > 0, "No candidates");
        require(block.timestamp >= e.startTime, "Too early");
        require(block.timestamp < e.endTime, "Election expired");

        e.state = ElectionState.ACTIVE;

        emit ElectionStarted(electionId, block.timestamp);
    }

    function finalizeElection(uint electionId) public onlyAdmin {
        Election storage e = elections[electionId];

        require(e.state == ElectionState.ACTIVE, "Not active");
        require(block.timestamp >= e.endTime, "Election still running");

        e.state = ElectionState.ENDED;

        emit ElectionFinalized(electionId, e.totalVotes);
    }
    function getElectionSummary(uint _electionId)
    public
    view
    returns (
        string memory,
        uint,
        uint,
        uint,
        ElectionState
    )
    {
        require(_electionId > 0 && _electionId <= electionCount,
            "Election does not exist");

        Election memory election = elections[_electionId];

        return (
            election.name,
            election.startTime,
            election.endTime,
            election.totalVotes,
            election.state
        );
    }
    
    function vote(
    uint electionId,
    uint candidateId
    ) public {
        Election storage e = elections[electionId];

        require(e.state == ElectionState.ACTIVE, "Election not active");
        require(block.timestamp >= e.startTime, "Voting not started");
        require(block.timestamp < e.endTime, "Voting period over");

        require(!hasVoted[electionId][msg.sender], "Already voted");

        require(
            candidateId > 0 &&
            candidateId <= candidateCount[electionId],
            "Invalid candidate"
        );

        candidates[electionId][candidateId].voteCount++;

        hasVoted[electionId][msg.sender] = true;

        e.totalVotes++;

        emit VoteCast(
            electionId,
            msg.sender,
            candidateId,
            e.totalVotes,
            block.timestamp
        );
    }
    function getCandidate(
    uint electionId,
    uint candidateId
    ) public view returns (uint, string memory, uint) {
        require(
            candidateId > 0 &&
            candidateId <= candidateCount[electionId],
            "Invalid candidate"
        );

        Candidate memory c = candidates[electionId][candidateId];

        return (c.id, c.name, c.voteCount);
    }
    function getWinner(uint _electionId)
    public
    view
    returns (uint, string memory, uint)
    {
        require(_electionId > 0 && _electionId <= electionCount,
            "Election does not exist");

        require(
            elections[_electionId].state == ElectionState.ENDED,
            "Election has not ended"
        );

        uint count = candidateCount[_electionId];

        require(count > 0, "No candidates available");

        uint winnerId = 1;

        for (uint i = 2; i <= count; i++) {
            if (
                candidates[_electionId][i].voteCount >
                candidates[_electionId][winnerId].voteCount
            ) {
                winnerId = i;
            }
        }

        Candidate memory winner = candidates[_electionId][winnerId];

        return (winner.id, winner.name, winner.voteCount);
    }
    function hasUserVoted(uint electionId, address voter)
    public
    view
    returns (bool)
    {
        require(
            elections[electionId].id != 0,
            "Election does not exist"
        );

        return hasVoted[electionId][voter];
    }
    function createElection(
        string memory _name,
        uint _startTime,
        uint _endTime
    ) public onlyAdmin {
        require(bytes(_name).length > 0, "Invalid name");
        require(_startTime > block.timestamp, "Invalid start time");
        require(_endTime > _startTime, "Invalid end time");

        electionCount++;

        elections[electionCount] = Election({
            id: electionCount,
            name: _name,
            startTime: _startTime,
            endTime: _endTime,
            totalVotes: 0,
            state: ElectionState.NOT_STARTED
        });

        emit ElectionCreated(electionCount, _name);
    }
    function proposeCancellation(uint electionId)
    public
    onlyOfficial
{
    require(
    elections[electionId].id != 0,
    "Election does not exist"
    );
    require(
        elections[electionId].state == ElectionState.ACTIVE ||
        elections[electionId].state == ElectionState.NOT_STARTED,
        "Cannot cancel this election"
    );

    proposalCount++;

    Proposal storage p = proposals[proposalCount];

    p.electionId = electionId;
    p.exists = true;

    emit ChangeProposed(proposalCount, electionId, msg.sender);
}

function approveChange(uint proposalId)
    public
    onlyOfficial
{
    Proposal storage p = proposals[proposalId];

    require(p.exists, "Proposal not found");
    require(!p.executed, "Already executed");
    require(!p.approved[msg.sender], "Already approved");

    p.approved[msg.sender] = true;
    p.approvalCount++;

    emit ChangeApproved(proposalId, msg.sender);
}

function executeChange(uint proposalId)
    public
    onlyOfficial
    {
        Proposal storage p = proposals[proposalId];

        require(p.exists, "Proposal not found");
        require(!p.executed, "Already executed");

        require(
            p.approvalCount >= REQUIRED_APPROVALS,
            "Insufficient approvals"
        );

        Election storage e = elections[p.electionId];

        require(
            e.state == ElectionState.ACTIVE ||
            e.state == ElectionState.NOT_STARTED,
            "Election cannot be cancelled"
        );

        p.executed = true;
        e.state = ElectionState.CANCELLED;

        emit ElectionCancelled(p.electionId);
    }
    function getProposalDetails(uint proposalId)
    public
    view
    returns (
        uint electionId,
        uint approvalCount,
        bool executed,
        bool exists
    )
    {
        Proposal storage p = proposals[proposalId];

        require(p.exists, "Proposal not found");

        return (
            p.electionId,
            p.approvalCount,
            p.executed,
            p.exists
        );
    }

    function hasApprovedProposal(uint proposalId, address official)
        public
        view
        returns (bool)
    {
        require(proposals[proposalId].exists, "Proposal not found");

        return proposals[proposalId].approved[official];
    }
}
