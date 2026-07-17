import NavigationBar from "../components/layout/Navbar";
import { FaVoteYea } from "react-icons/fa";
import { useState, useEffect } from "react";
import {
  Container,
  Card,
  Button,
  Form,
  Alert,
  Row,
  Col
} from "react-bootstrap";
function Vote() {
  const [wallet, setWallet] = useState("");

  const [identity, setIdentity] = useState("");

  const [verified, setVerified] = useState(false);

  const [message, setMessage] = useState("");

  const [candidates, setCandidates] = useState([]);
  const [electionLive, setElectionLive] = useState(false);

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  useEffect(() => {

    loadElectionStatus();

}, []);
  async function connectWallet() {

    if (!window.ethereum) {

      setMessage("Please install MetaMask.");

      return;

    }

    const accounts = await window.ethereum.request({

      method: "eth_requestAccounts"

    });

    setWallet(accounts[0]);

  }
 async function verifyVoter() {

    if (!wallet) {

        setMessage("Please connect your MetaMask wallet first.");

        return;

    }

    const response = await fetch(
        "http://127.0.0.1:5000/verifyVoter",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                identity
            })
        }
    );

    const data = await response.json();

    if (data.success) {

        setVerified(true);

        setMessage("Voter verified successfully.");

        loadCandidates();

    }
    else {

        setVerified(false);

        setMessage(data.message);

    }

}
  async function loadCandidates() {

    const response = await fetch(

      "http://127.0.0.1:5000/getCandidates"

    );

    const data = await response.json();

    setCandidates(data);

  }
  async function castVote() {

    const response = await fetch(

        "http://127.0.0.1:5000/castVote",

        {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                candidateId: selectedCandidate,

                identity,

                wallet

            })

        }

    );

    const data = await response.json();

    if (data.success) {

        alert(
    "🗳️ Vote Successfully Recorded!\n\n" +
    "Your vote has been securely stored on the blockchain.\n\n" +
    "Transaction ID:\n" +
    data.txHash +
    "\n\nThank you for participating!"
);

        setVerified(false);

        setSelectedCandidate(null);

        setIdentity("");

        setMessage("");

    }

    else {

        alert(data.error || data.message);

    }

}
async function loadElectionStatus() {

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/summary"
        );

        const data = await response.json();

        setElectionLive(data.started);

    }

    catch (error) {

        console.log(error);

    }

}
  return (
    <>
      <NavigationBar />

      <div className="container mt-5">
        <h1>
          <FaVoteYea className="me-2" color="#198754" />
          Cast Vote
        </h1>
        <hr />

        <p>Select a candidate and cast your vote.</p>
        <Card className="p-4 shadow mt-4">

          <h4>Wallet Connection</h4>

          <Button
            onClick={connectWallet}
            className="mt-3"
          >
            Connect MetaMask
          </Button>

          {
            wallet &&
            <Alert
              variant="success"
              className="mt-3"
            >
              Connected Wallet:
              <br />
              {wallet}
            </Alert>
          }

          <hr />

          <h4>Voter Verification</h4>

          <Form.Control
            className="mt-3"
            placeholder="Enter Aadhaar or Voter ID"
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
          />

          <Button
            className="mt-3"
            onClick={verifyVoter}
          >
            Verify
          </Button>

        </Card>
        {
          message &&
          <Alert
            variant={
              verified
                ? "success"
                : "danger"
            }
            className="mt-3"
          >
            {message}
          </Alert>
        }
        {
          verified &&

          <div className="mt-5">

            <h3>

              Choose Your Candidate

            </h3>

            <Row>

              {

                candidates.map(candidate => (

                  <Col
                    md={4}
                    key={candidate.id}
                    className="mt-3"
                  >

                    <Card
                      className={
                        selectedCandidate === candidate.id
                          ?
                          "border border-success shadow"
                          :
                          "shadow"
                      }
                    >

                      <Card.Body
                        className="text-center"
                      >

                        <h4>

                          👤

                        </h4>

                        <h5>

                          {candidate.name}

                        </h5>

                        <Button

                          className="mt-3"

                          variant={
                            selectedCandidate === candidate.id
                              ?
                              "success"
                              :
                              "outline-success"
                          }

                          onClick={() => setSelectedCandidate(candidate.id)}

                        >

                          Select

                        </Button>

                      </Card.Body>

                    </Card>

                  </Col>

                ))

              }

            </Row>

          </div>

        }
        {
    verified &&
    selectedCandidate &&

    <div className="text-center mt-5">

        <Button
    size="lg"
    variant="success"
    onClick={castVote}
    disabled={!electionLive}
>
    {
        electionLive
            ? "Cast Vote"
            : "Election Closed"
    }
</Button>
{
    !electionLive &&

    <Alert
        variant="warning"
        className="mt-3"
    >
        Voting is currently closed.
    </Alert>
}

    </div>
}
      </div>
    </>
  );
}

export default Vote;