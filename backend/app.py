from contract import (
    get_candidate_count,
    get_candidate,
    add_candidate,
    start_election,
    end_election,
    vote,
    get_winner,
    get_all_candidates,
    get_current_leader,
    get_election_summary,
    get_admin,
    add_candidate
)
from database import mark_voted
from database import verify_voter
from contract import end_election
from flask import Flask, request, jsonify
from flask_cors import CORS
from database import initialize_database
from database import get_all_voters
from csv_import import import_voters
app = Flask(__name__)
initialize_database()
CORS(app, resources={r"/*": {"origins": "*"}})
@app.route("/")
def home():
    return "Blockchain Voting System Backend Running!"
@app.route("/getVoters")
def get_voters():

    return jsonify(get_all_voters())
@app.route("/candidateCount")
def candidate_count():

    return jsonify({
        "candidateCount": get_candidate_count()
    })
@app.route("/getCandidates", methods=["GET"])
def get_candidates():

    candidates = []

    count = get_candidate_count()

    for i in range(1, count + 1):
        candidates.append(get_candidate(i))

    return jsonify(candidates)
@app.route("/verifyVoter", methods=["POST"])
def verify_voter_route():

    data = request.json

    voter = verify_voter(data["identity"])

    if voter is None:
        return jsonify({
            "success": False,
            "message": "Voter not found."
        })

    voter = dict(voter)

    if voter["eligible"] == 0:
        return jsonify({
            "success": False,
            "message": "You are not eligible to vote."
        })

    if voter["has_voted"] == 1:
        return jsonify({
            "success": False,
            "message": "You have already voted."
        })

    return jsonify({
        "success": True,
        "voter": voter
    })
@app.route("/addCandidate", methods=["POST"])
def add_candidate_route():

    data = request.json

    result = add_candidate(data["name"])

    return jsonify(result)
@app.route("/castVote", methods=["POST"])
def cast_vote():

    data = request.json

    candidate_id = data["candidateId"]

    identity = data["identity"]

    voter_wallet = data["wallet"]

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

    if voter["has_voted"] == 1:

        return jsonify({

            "success": False,

            "message": "You have already voted."

        })

    result = vote(candidate_id, voter_wallet)

    if result["success"]:

        mark_voted(identity)

        return jsonify({

            "success": True,

            "txHash": result["txHash"]

        })

    return jsonify(result)
@app.route("/adminLogin", methods=["POST"])
def admin_login():

    data = request.json

    username = data["username"]

    password = data["password"]

    if username == "admin" and password == "admin123":

        return jsonify({

            "success": True

        })

    return jsonify({

        "success": False

    })

@app.route("/uploadVoters", methods=["POST"])
def upload_voters():

    if "file" not in request.files:

        return jsonify({
            "success": False,
            "message": "No file uploaded."
        })

    file = request.files["file"]

    result = import_voters(file)

    return jsonify(result)
@app.route("/currentLeader")
def current_leader():
    return jsonify(get_current_leader())
@app.route("/candidates")
def candidates():
    return jsonify(get_all_candidates())
@app.route("/candidate/<int:id>")
def candidate(id):

    return jsonify(
        get_candidate(id)
    )
@app.route("/summary")
def summary():
    return jsonify(get_election_summary())
@app.route("/endElection", methods=["POST"])
def end():
    return jsonify(end_election())
@app.route("/addCandidate", methods=["POST"])
def add():
    data = request.get_json()
    return jsonify(add_candidate(data["name"]))

@app.route("/startElection", methods=["POST"])
def start():

    print("Start Election API Called")

    return jsonify(start_election())
@app.route("/vote", methods=["POST"])
def submit_vote():

    data = request.get_json()

    success = vote(
        data["candidateId"],
        data["voter"]
    )

    return jsonify({
        "success": success
    })
@app.route("/admin")
def admin_address():
    return jsonify({
        "admin": get_admin()
    })
@app.route("/winner")
def winner():

    return jsonify(
        get_winner()
    )
@app.route("/testVerify/<identity>")
def test_verify(identity):

    voter = verify_voter(identity)

    if voter is None:
        return jsonify({
            "success": False,
            "message": "Voter not found"
        })

    voter = dict(voter)

    if voter["eligible"] == 0:
        return jsonify({
            "success": False,
            "message": "Not eligible"
        })

    if voter["has_voted"] == 1:
        return jsonify({
            "success": False,
            "message": "Already voted"
        })

    return jsonify({
        "success": True,
        "voter": voter
    })


if __name__ == "__main__":
    app.run(debug=True)