// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract Voting {
    address public admin;

    struct Candidate {
    uint id;
    string name;
    uint voteCount;
    }
    uint public totalVotes;
    string public electionName;
    mapping(uint => Candidate) public candidates; //key->value mapping here key is integer and value is entire struct
    uint public candidateCount;
    mapping(address => bool) public hasVoted; // to check if the person has already voted
    bool public electionStarted;
    constructor(string memory _electionName) { //It runs only once, when the smart contract is deployed.
    admin = msg.sender; // The person who deploys the contract automatically becomes the admin. 
    electionName = _electionName;
    }
    event CandidateAdded(
    uint id,
    string name
    );
    event ElectionStarted(
    uint timestamp
    );
    event ElectionEnded(
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
        address indexed voter,
        uint indexed candidateId,
        string candidateName,
        uint totalVotes,
        uint timestamp
    );
    event ElectionStatistics(
        uint totalVotes
    );
    function addCandidate(string memory _name) public{ /* memory means the string exists only while this function is executing. _name stores that name. */
        require(msg.sender == admin, "Only admin can add candidates"); /* when require fails then everything is cancelled , no changes are made to the blockchain and we get an error msg. Here this is the condition that checks if the the admin is the one calling the function */
        require(!electionStarted,"Cannot add candidates after election starts");
        require(bytes(_name).length > 0,"Candidate name cannot be empty");
        candidateCount++;
        candidates[candidateCount] = Candidate(candidateCount, _name, 0);
        emit CandidateAdded(
        candidateCount,
        _name
        );
    }
    function getCurrentLeader()
    public
    view
    returns (
        uint,
        string memory,
        uint,
        bool
    )
{
    bool tie = false;
    uint winningId = 0;
    uint winningVoteCount = 0;
    string memory winnerName = "";

    for(uint i = 1; i <= candidateCount; i++)
    {
        if(candidates[i].voteCount > winningVoteCount)
    {
        winningId = candidates[i].id;
        winnerName = candidates[i].name;
        winningVoteCount = candidates[i].voteCount;

    tie = false;
    }
    else if(
    candidates[i].voteCount == winningVoteCount &&
    winningVoteCount > 0
    )
    {
    tie = true;
    }
    }

    return(
        winningId,
        winnerName,
        winningVoteCount,
        tie
    );
}
function getAllCandidates()
    public
    view
    returns (Candidate[] memory)
{
    Candidate[] memory allCandidates = new Candidate[](candidateCount);

    for(uint i = 1; i <= candidateCount; i++)
    {
        allCandidates[i - 1] = candidates[i];
    }

    return allCandidates;
}
function getElectionStatus()
public
view
returns(bool)
{
    return electionStarted;
}
    function startElection() public onlyAdmin{
    //require(msg.sender == admin, "Only admin can start the election");
    require(candidateCount > 0, "No candidates available");
    require(!electionStarted, "Election already started");
    electionStarted = true;
    emit ElectionStarted(
    block.timestamp
);
}
function getElectionSummary()
    public
    view
    returns(
        string memory,
        bool,
        uint,
        uint
    )
{
    return(
        electionName,
        electionStarted,
        candidateCount,
        totalVotes
    );
}
    function endElection() public onlyAdmin {
    //require(msg.sender == admin, "Only admin can end the election");
    require(electionStarted, "Election is not active");
    electionStarted = false;
    emit ElectionEnded(
    block.timestamp
    );
}
    function vote(uint _candidateId) public{
        require(electionStarted, "Election has not started yet");
        require(!hasVoted[msg.sender], "You have already voted!");
        require( _candidateId > 0 && _candidateId <= candidateCount, "Invalid Candidate");
        candidates[_candidateId].voteCount++;
        hasVoted[msg.sender]=true;
        totalVotes++;
        emit VoteCast(
            msg.sender,
            _candidateId,
            candidates[_candidateId].name,
            totalVotes,
             block.timestamp
        );
        emit ElectionStatistics(
        totalVotes
        );
    }
    function getCandidate(uint _candidateId) 
    public 
    view //to not allow modification in the blockchain, this function only reads data 
    returns(uint, string memory, uint){ //returning id, name and vote count of the candidate
        require(_candidateId > 0 &&_candidateId <= candidateCount,"Invalid Candidate");
        Candidate memory candidate = candidates[_candidateId]; /* fetch Candidate details from the mapping and store it temporarily in a variable named candidate */

        return (
            candidate.id,
            candidate.name,
            candidate.voteCount
        );
    }
    function getWinner()
    public
    view
    returns (
        uint,
        string memory,
        uint,
        bool
    ){
        bool tie = false;
    uint winningId = 0;
    uint winningVoteCount = 0;
    string memory winnerName = "";
    require(!electionStarted,"Election still in progress");
    require(totalVotes > 0, "No votes have been cast");
    for (uint i = 1; i <= candidateCount; i++) {
          if(candidates[i].voteCount > winningVoteCount)
    {
        winningId = candidates[i].id;
        winnerName = candidates[i].name;
        winningVoteCount = candidates[i].voteCount;

    tie = false;
    }
    else if(
    candidates[i].voteCount == winningVoteCount &&
    winningVoteCount > 0
    )
    {
    tie = true;
    }
    }
    return (
    winningId,
    winnerName,
    winningVoteCount,
    tie
    );
}
function hasUserVoted(address voter)
    public
    view
    returns(bool)
{
    return hasVoted[voter];
}
}
