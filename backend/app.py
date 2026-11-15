
from flask import Flask, request, jsonify
from flask_cors import CORS

from contract import (
    get_candidate_count,
    get_candidate,
    add_candidate,
    start_election,
    finalize_election,
    vote,
    get_winner,
    get_all_candidates,
    get_current_leader,
    get_election_summary,
    get_election_status,
    get_admin,
    create_election,
    get_all_elections,
    propose_cancellation,
    approve_change,
    execute_change,
    get_proposal_details,
    get_audit_history,
    has_user_voted
)

from database import (
    initialize_database,
    verify_voter,
    get_all_voters,
    has_voted_in_election,
    mark_voted_in_election
)

from csv_import import import_voters


app = Flask(__name__)

initialize_database()

CORS(app, resources={r"/*": {"origins": "*"}})


# --------------------------------------------------
# 1. HOME
# --------------------------------------------------

@app.route("/")
def home():
    return "Blockchain Voting System Backend Running!"


# --------------------------------------------------
# 2. VOTER MANAGEMENT
# --------------------------------------------------

@app.route("/getVoters", methods=["GET"])
def get_voters():
    return jsonify(get_all_voters())


@app.route("/verifyVoter", methods=["POST"])
def verify_voter_route():

    data = request.get_json()

    identity = data.get("identity")

    if not identity:
        return jsonify({
            "success": False,
            "message": "Voter identity is required."
        }), 400

    voter = verify_voter(identity)

    if voter is None:
        return jsonify({
            "success": False,
            "message": "Voter not found."
        }), 404

    voter = dict(voter)

    if voter["eligible"] == 0:
        return jsonify({
            "success": False,
            "message": "You are not eligible to vote."
        })

    # Do not check the old global SQLite has_voted flag here.
    # Voting eligibility is now checked separately for each election.

    return jsonify({
        "success": True,
        "voter": voter
    })


@app.route("/uploadVoters", methods=["POST"])
def upload_voters():

    if "file" not in request.files:
        return jsonify({
            "success": False,
            "message": "No file uploaded."
        }), 400

    file = request.files["file"]

    result = import_voters(file)

    return jsonify(result)


# --------------------------------------------------
# 3. ELECTION CREATION AND RETRIEVAL
# --------------------------------------------------

@app.route("/createElection", methods=["POST"])
def create_election_route():

    data = request.get_json()

    name = data.get("name")
    start_time = data.get("startTime")
    end_time = data.get("endTime")

    if not name or start_time is None or end_time is None:
        return jsonify({
            "success": False,
            "message": "Name, startTime and endTime are required."
        }), 400

    result = create_election(
        name,
        start_time,
        end_time
    )

    return jsonify(result)


@app.route("/elections", methods=["GET"])
def elections_route():

    return jsonify(get_all_elections())


@app.route("/election/<int:election_id>", methods=["GET"])
def election_details(election_id):

    return jsonify(get_election_summary(election_id))


# --------------------------------------------------
# 4. CANDIDATE MANAGEMENT
# --------------------------------------------------

@app.route("/candidateCount/<int:election_id>", methods=["GET"])
def candidate_count(election_id):

    return jsonify({
        "electionId": election_id,
        "candidateCount": get_candidate_count(election_id)
    })


@app.route("/getCandidates/<int:election_id>", methods=["GET"])
def get_candidates(election_id):

    return jsonify(get_all_candidates(election_id))


@app.route("/candidates/<int:election_id>", methods=["GET"])
def candidates(election_id):

    return jsonify(get_all_candidates(election_id))


@app.route("/candidate/<int:election_id>/<int:candidate_id>", methods=["GET"])
def candidate(election_id, candidate_id):

    return jsonify(
        get_candidate(election_id, candidate_id)
    )


@app.route("/addCandidate", methods=["POST"])
def add_candidate_route():

    data = request.get_json()

    election_id = data.get("electionId")
    name = data.get("name")

    if election_id is None or not name:
        return jsonify({
            "success": False,
            "message": "electionId and name are required."
        }), 400

    result = add_candidate(
        election_id,
        name
    )

    return jsonify(result)


# --------------------------------------------------
# 5. ELECTION CONTROL
# --------------------------------------------------

@app.route("/startElection", methods=["POST"])
def start():

    data = request.get_json()

    election_id = data.get("electionId")

    if election_id is None:
        return jsonify({
            "success": False,
            "message": "electionId is required."
        }), 400

    return jsonify(start_election(election_id))


@app.route("/finalizeElection", methods=["POST"])
def finalize():

    data = request.get_json()

    election_id = data.get("electionId")

    if election_id is None:
        return jsonify({
            "success": False,
            "message": "electionId is required."
        }), 400

    return jsonify(finalize_election(election_id))


@app.route("/electionStatus/<int:election_id>", methods=["GET"])
def election_status(election_id):

    return jsonify({
        "electionId": election_id,
        "status": get_election_status(election_id)
    })


# --------------------------------------------------
# 6. VOTING
# --------------------------------------------------


@app.route("/castVote", methods=["POST"])
def cast_vote():

    data = request.get_json()

    election_id = data.get("electionId")
    candidate_id = data.get("candidateId")
    identity = data.get("identity")
    voter_wallet = data.get("wallet")

    if (
        election_id is None
        or candidate_id is None
        or not identity
        or not voter_wallet
    ):
        return jsonify({
            "success": False,
            "message": "electionId, candidateId, identity and wallet are required."
        }), 400

    # 1. Verify voter using SQLite
    voter = verify_voter(identity)

    if not voter:
        return jsonify({
            "success": False,
            "message": "Voter not found"
        }), 404

    voter = dict(voter)

    if not voter["eligible"]:
        return jsonify({
            "success": False,
            "message": "Voter is not eligible"
        }), 403

    # 2. Check whether this registered voter
    # has already voted in this election
    if has_voted_in_election(election_id, voter["id"]):
        return jsonify({
            "success": False,
            "message": "You have already voted in this election"
        }), 400

    # 3. Check whether this wallet has already voted
    # in this election on the blockchain
    already_voted = has_user_voted(election_id, voter_wallet)

    if isinstance(already_voted, dict):
        return jsonify(already_voted), 500

    if already_voted:
        return jsonify({
            "success": False,
            "message": "This wallet has already voted in this election."
        }), 400

    # 4. Cast vote on blockchain
    result = vote(
        election_id,
        candidate_id,
        voter_wallet
    )

    # 5. Update SQLite only after successful blockchain transaction
    if result.get("success"):
        mark_voted_in_election(
            election_id,
            voter["id"]
        )
        return jsonify(result), 200

    return jsonify(result), 400



# --------------------------------------------------
# 7. LEADERBOARD AND RESULTS
# --------------------------------------------------

@app.route("/currentLeader/<int:election_id>", methods=["GET"])
def current_leader(election_id):

    return jsonify(
        get_current_leader(election_id)
    )


@app.route("/summary/<int:election_id>", methods=["GET"])
def summary(election_id):

    return jsonify(
        get_election_summary(election_id)
    )


@app.route("/winner/<int:election_id>", methods=["GET"])
def winner(election_id):

    return jsonify(
        get_winner(election_id)
    )


# --------------------------------------------------
# 8. GOVERNANCE
# --------------------------------------------------

@app.route("/proposeCancellation", methods=["POST"])
def propose_cancellation_route():

    data = request.get_json()

    election_id = data.get("electionId")
    official = data.get("official")

    if election_id is None or not official:
        return jsonify({
            "success": False,
            "message": "electionId and official wallet are required."
        }), 400

    result = propose_cancellation(
        election_id,
        official
    )

    return jsonify(result)


@app.route("/approveChange", methods=["POST"])
def approve_change_route():

    data = request.get_json()

    proposal_id = data.get("proposalId")
    official = data.get("official")

    if proposal_id is None or not official:
        return jsonify({
            "success": False,
            "message": "proposalId and official wallet are required."
        }), 400

    result = approve_change(
        proposal_id,
        official
    )

    return jsonify(result)


@app.route("/executeChange", methods=["POST"])
def execute_change_route():

    data = request.get_json()

    proposal_id = data.get("proposalId")
    official = data.get("official")

    if proposal_id is None or not official:
        return jsonify({
            "success": False,
            "message": "proposalId and official wallet are required."
        }), 400

    result = execute_change(
        proposal_id,
        official
    )

    return jsonify(result)


@app.route("/proposal/<int:proposal_id>", methods=["GET"])
def proposal_details(proposal_id):

    return jsonify(
        get_proposal_details(proposal_id)
    )


# --------------------------------------------------
# 9. AUDIT HISTORY
# --------------------------------------------------

@app.route("/auditHistory/<int:election_id>", methods=["GET"])
def audit_history(election_id):

    return jsonify(
        get_audit_history(election_id)
    )


# --------------------------------------------------
# 10. ADMIN LOGIN AND ADDRESS
# --------------------------------------------------

@app.route("/adminLogin", methods=["POST"])
def admin_login():

    data = request.get_json()

    username = data.get("username")
    password = data.get("password")

    if username == "admin" and password == "admin123":
        return jsonify({
            "success": True
        })

    return jsonify({
        "success": False
    })


@app.route("/admin", methods=["GET"])
def admin_address():

    return jsonify({
        "admin": get_admin()
    })


# --------------------------------------------------
# 11. TEST VOTER VERIFICATION
# --------------------------------------------------

@app.route("/testVerify/<identity>", methods=["GET"])
def test_verify(identity):

    voter = verify_voter(identity)

    if voter is None:
        return jsonify({
            "success": False,
            "message": "Voter not found."
        })

    voter = dict(voter)

    if voter["eligible"] == 0:
        return jsonify({
            "success": False,
            "message": "Not eligible."
        })

    return jsonify({
        "success": True,
        "voter": voter
    })


# --------------------------------------------------
# 12. RUN FLASK
# --------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True)
