from web3 import Web3
import json

from config import (
    GANACHE_URL,
    CONTRACT_ADDRESS,
    ABI_PATH
)
web3 = Web3(Web3.HTTPProvider(GANACHE_URL))

if web3.is_connected():
    print("Connected to Ganache")
    print("Ganache Accounts:")
    print(web3.eth.accounts)
else:
    print("Connection failed")

with open(ABI_PATH, "r") as file:
    contract_json = json.load(file)

abi = contract_json["abi"]
contract = web3.eth.contract(
    address=Web3.to_checksum_address(CONTRACT_ADDRESS),
    abi=abi
)
print("Connected to contract successfully!")
#admin = contract.functions.admin().call()
def get_candidate_count():
    return contract.functions.candidateCount().call()
def get_candidate(candidate_id):
    try:
        candidate = contract.functions.getCandidate(candidate_id).call()

        return {
            "id": candidate[0],
            "name": candidate[1],
            "votes": candidate[2]
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def start_election():
    try:
        admin = get_admin()

        tx_hash = contract.functions.startElection().transact({
            "from": admin
        })

        receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

        return {
            "success": receipt.status == 1,
            "txHash": tx_hash.hex()
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }
def end_election():
    try:
        admin = get_admin()

        print("Admin =", admin)

        print("Ganache =", web3.eth.accounts)
        
        tx_hash = contract.functions.endElection().transact({
            "from": admin
        })

        receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

        return {
            "success": receipt.status == 1,
            "txHash": tx_hash.hex()
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
def get_current_leader():
    leader = contract.functions.getCurrentLeader().call()

    return {
        "id": leader[0],
        "name": leader[1],
        "votes": leader[2],
        "tie": leader[3]
    }
def get_election_summary():
    summary = contract.functions.getElectionSummary().call()

    return {
        "name": summary[0],
        "started": summary[1],
        "candidateCount": summary[2],
        "totalVotes": summary[3]
    }
def get_all_candidates():
    candidates = contract.functions.getAllCandidates().call()

    return [
        {
            "id": c[0],
            "name": c[1],
            "votes": c[2]
        }
        for c in candidates
    ]
def get_admin():
    admin = contract.functions.admin().call()
    print("Contract admin:", admin)
    return admin
def vote(candidate_id, voter):

    try:

        voter = Web3.to_checksum_address(voter)

        print("Wallet received:", voter)
        print("Ganache accounts:", web3.eth.accounts)

        tx_hash = contract.functions.vote(candidate_id).transact({
            "from": voter
        })

        receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

        return {
            "success": receipt.status == 1,
            "txHash": receipt.transactionHash.hex()
        }

    except Exception as e:

        print("Vote Error:", e)

        return {
            "success": False,
            "error": str(e)
        }

def get_winner():
    try:
        winner = contract.functions.getWinner().call()

        return {
            "id": winner[0],
            "name": winner[1],
            "votes": winner[2]
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def add_candidate(name):
    try:
        tx_hash = contract.functions.addCandidate(name).transact(
            {
                "from": web3.eth.accounts[0]
            }
        )

        receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

        return {
            "success": True,
            "txHash": receipt.transactionHash.hex()
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
    
#def add_candidate(name):
    try:
        admin = get_admin()

        tx_hash = contract.functions.addCandidate(name).transact({
            "from": admin
        })

        receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

        return {
            "success": receipt.status == 1,
            "txHash": receipt.transactionHash.hex()
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }