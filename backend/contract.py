
from web3 import Web3
import json

from config import GANACHE_URL, CONTRACT_ADDRESS, ABI_PATH
from datetime import datetime

# --------------------------------------------------
# 1. CONNECT TO GANACHE
# --------------------------------------------------

web3 = Web3(Web3.HTTPProvider(GANACHE_URL))

if web3.is_connected():
    print("Connected to Ganache")
    print("Ganache Accounts:", web3.eth.accounts)
else:
    raise ConnectionError("Could not connect to Ganache")


# --------------------------------------------------
# 2. LOAD CONTRACT ABI
# --------------------------------------------------

with open(ABI_PATH, "r") as file:
    contract_json = json.load(file)

abi = contract_json["abi"]

contract = web3.eth.contract(
    address=Web3.to_checksum_address(CONTRACT_ADDRESS),
    abi=abi
)

print("Connected to Voting Contract!")


# --------------------------------------------------
# 3. COMMON HELPER FUNCTIONS
# --------------------------------------------------

def get_admin():
    return contract.functions.admin().call()

def get_election_state_name(state):
    states = {
        0: "NOT_STARTED",
        1: "ACTIVE",
        2: "ENDED",
        3: "CANCELLED"
    }
    return states.get(state, "UNKNOWN")

def send_transaction(function, sender):
    """
    Sends a blockchain transaction and waits for confirmation.
    The sender must be an unlocked Ganache account.
    """

    sender = Web3.to_checksum_address(sender)

    tx_hash = function.transact({
        "from": sender
    })

    receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

    return {
        "success": receipt.status == 1,
        "txHash": receipt.transactionHash.hex()
    }


# --------------------------------------------------
# 4. ELECTION CREATION AND RETRIEVAL
# --------------------------------------------------

def create_election(name, start_time, end_time):
    try:
        admin = get_admin()

        return send_transaction(
            contract.functions.createElection(
                name,
                int(start_time),
                int(end_time)
            ),
            admin
        )

    except Exception as e:
        return {"success": False, "error": str(e)}


def get_all_elections():
    try:
        election_count = contract.functions.electionCount().call()

        elections = []

        for election_id in range(1, election_count + 1):

            summary = contract.functions.getElectionSummary(
                election_id
            ).call()

            elections.append({
                "id": election_id,
                "name": summary[0],
                "startTime": summary[1],
                "endTime": summary[2],
                "totalVotes": summary[3],
                "state": get_election_state_name(summary[4])
            })

        return elections

    except Exception as e:
        return {"success": False, "error": str(e)}


def get_election_summary(election_id):
    try:
        summary = contract.functions.getElectionSummary(
            election_id
        ).call()

        return {
            "id": election_id,
            "name": summary[0],
            "startTime": summary[1],
            "endTime": summary[2],
            "totalVotes": summary[3],
            "state": get_election_state_name(summary[4])
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


def get_election_status(election_id):
    try:
        return contract.functions.getElectionStatus(
            election_id
        ).call()

    except Exception as e:
        return {"success": False, "error": str(e)}


# --------------------------------------------------
# 5. CANDIDATE FUNCTIONS
# --------------------------------------------------

def get_candidate_count(election_id):
    return contract.functions.candidateCount(
        election_id
    ).call()


def get_candidate(election_id, candidate_id):
    try:
        candidate = contract.functions.getCandidate(
            election_id,
            candidate_id
        ).call()

        return {
            "id": candidate[0],
            "name": candidate[1],
            "votes": candidate[2]
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


def get_all_candidates(election_id):
    try:
        candidates = contract.functions.getAllCandidates(
            election_id
        ).call()

        return [
            {
                "id": c[0],
                "name": c[1],
                "votes": c[2]
            }
            for c in candidates
        ]

    except Exception as e:
        return {"success": False, "error": str(e)}


def add_candidate(election_id, name):
    try:
        admin = get_admin()

        return send_transaction(
            contract.functions.addCandidate(
                election_id,
                name
            ),
            admin
        )

    except Exception as e:
        return {"success": False, "error": str(e)}


# --------------------------------------------------
# 6. ELECTION CONTROL
# --------------------------------------------------

def start_election(election_id):
    try:
        admin = get_admin()

        return send_transaction(
            contract.functions.startElection(election_id),
            admin
        )

    except Exception as e:
        return {"success": False, "error": str(e)}


def finalize_election(election_id):
    try:
        admin = get_admin()
        latest_block = web3.eth.get_block("latest")

        print("Ganache blockchain time:",
            datetime.fromtimestamp(latest_block.timestamp))

        print("Election end time:",
            datetime.fromtimestamp(
                contract.functions.getElectionSummary(election_id).call()[2]
            ))
        return send_transaction(
            contract.functions.finalizeElection(election_id),
            admin
        )

    except Exception as e:
        return {"success": False, "error": str(e)}


# --------------------------------------------------
# 7. VOTING
# --------------------------------------------------

def vote(election_id, candidate_id, voter):
    try:
        voter = Web3.to_checksum_address(voter)

        print("Wallet received:", voter)
        print("Ganache accounts:", web3.eth.accounts)

        return send_transaction(
            contract.functions.vote(
                election_id,
                candidate_id
            ),
            voter
        )

    except Exception as e:
        print("Vote Error:", e)
        return {"success": False, "error": str(e)}


def has_user_voted(election_id, voter):
    try:
        voter = Web3.to_checksum_address(voter)

        return contract.functions.hasUserVoted(
            election_id,
            voter
        ).call()

    except Exception as e:
        return {"success": False, "error": str(e)}


# --------------------------------------------------
# 8. LEADER AND WINNER
# --------------------------------------------------

def get_current_leader(election_id):
    try:
        leader = contract.functions.getCurrentLeader(
            election_id
        ).call()

        return {
            "id": leader[0],
            "name": leader[1],
            "votes": leader[2]
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


def get_winner(election_id):
    try:
        winner = contract.functions.getWinner(
            election_id
        ).call()

        return {
            "id": winner[0],
            "name": winner[1],
            "votes": winner[2]
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


# --------------------------------------------------
# 9. GOVERNANCE / CANCELLATION PROPOSALS
# --------------------------------------------------

def propose_cancellation(election_id, official):
    try:
        return send_transaction(
            contract.functions.proposeCancellation(election_id),
            official
        )

    except Exception as e:
        return {"success": False, "error": str(e)}


def approve_change(proposal_id, official):
    try:
        return send_transaction(
            contract.functions.approveChange(proposal_id),
            official
        )

    except Exception as e:
        return {"success": False, "error": str(e)}


def execute_change(proposal_id, official):
    try:
        return send_transaction(
            contract.functions.executeChange(proposal_id),
            official
        )

    except Exception as e:
        return {"success": False, "error": str(e)}


def get_proposal_details(proposal_id):
    try:
        details = contract.functions.getProposalDetails(
            proposal_id
        ).call()

        return {
            "electionId": details[0],
            "approvalCount": details[1],
            "executed": details[2],
            "exists": details[3]
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


def has_approved_proposal(proposal_id, official):
    try:
        official = Web3.to_checksum_address(official)

        return contract.functions.hasApprovedProposal(
            proposal_id,
            official
        ).call()

    except Exception as e:
        return {"success": False, "error": str(e)}


# --------------------------------------------------
# 10. AUDIT HISTORY
# --------------------------------------------------

def get_audit_history(election_id):
    try:
        events = []

        event_names = [
            "ElectionCreated",
            "CandidateAdded",
            "ElectionStarted",
            "VoteCast",
            "ChangeProposed",
            "ChangeApproved",
            "ElectionCancelled",
            "ElectionFinalized"
        ]

        # First collect proposal-to-election relationships.
        proposal_elections = {}

        proposed_logs = contract.events.ChangeProposed().get_logs(
            from_block=0
        )

        for log in proposed_logs:
            args = dict(log["args"])
            proposal_elections[args["proposalId"]] = args["electionId"]

        # Retrieve each event type.
        for event_name in event_names:

            event_class = getattr(contract.events, event_name)
            logs = event_class().get_logs(from_block=0)

            for log in logs:
                args = dict(log["args"])

                # ChangeApproved does not directly contain electionId.
                if event_name == "ChangeApproved":
                    related_election = proposal_elections.get(
                        args["proposalId"]
                    )

                    if related_election != election_id:
                        continue

                    args["electionId"] = related_election

                # Filter events belonging to the requested election.
                elif args.get("electionId") != election_id:
                    continue

                events.append({
                    "event": event_name,
                    "data": args,
                    "blockNumber": log["blockNumber"],
                    "transactionHash": log["transactionHash"].hex()
                })

        # Display events in blockchain order.
        events.sort(key=lambda x: x["blockNumber"])

        return events

    except Exception as e:
        return {"success": False, "error": str(e)}
