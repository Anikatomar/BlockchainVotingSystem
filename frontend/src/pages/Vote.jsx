
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
    Col,
    Spinner,
    Badge
} from "react-bootstrap";

const API = "http://127.0.0.1:5000";

function Vote() {
    const [wallet, setWallet] = useState("");
    const [identity, setIdentity] = useState("");

    const [elections, setElections] = useState([]);
    const [selectedElection, setSelectedElection] = useState("");

    const [electionSummary, setElectionSummary] = useState(null);
    const [electionLive, setElectionLive] = useState(false);

    const [verified, setVerified] = useState(false);
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidate, setSelectedCandidate] = useState(null);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("info");

    const [loadingElections, setLoadingElections] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Load all available elections when the page opens.
    useEffect(() => {
        loadElections();
    }, []);

    async function loadElections() {
        try {
            setLoadingElections(true);

            const response = await fetch(`${API}/elections`);
            const data = await response.json();

            if (!response.ok || !Array.isArray(data)) {
                throw new Error(data.error || "Could not load elections.");
            }

            setElections(data);
        } catch (error) {
            showMessage(error.message, "danger");
        } finally {
            setLoadingElections(false);
        }
    }

    // Load summary and candidates for the selected election.
    async function loadElectionDetails(electionId) {
        if (!electionId) return;

        try {
            setLoadingDetails(true);

            setVerified(false);
            setCandidates([]);
            setSelectedCandidate(null);
            setElectionSummary(null);
            setElectionLive(false);

            const [summaryResponse, candidatesResponse] = await Promise.all([
                fetch(`${API}/summary/${electionId}`),
                fetch(`${API}/getCandidates/${electionId}`)
            ]);

            const summary = await summaryResponse.json();
            const candidateData = await candidatesResponse.json();

            if (!summaryResponse.ok) {
                throw new Error(summary.error || "Could not load election details.");
            }

            if (!candidatesResponse.ok || !Array.isArray(candidateData)) {
                throw new Error(
                    candidateData.error || "Could not load candidates."
                );
            }

            setElectionSummary(summary);
            setCandidates(candidateData);

            const state = summary.state;
            const isActive =
                state === 1 ||
                String(state).toUpperCase() === "ACTIVE";

            const now = Math.floor(Date.now() / 1000);
            const start = Number(summary.startTime);
            const end = Number(summary.endTime);

            const withinTime =
                Number.isFinite(start) &&
                Number.isFinite(end) &&
                now >= start &&
                now < end;

            setElectionLive(isActive && withinTime);

            if (!isActive) {
                showMessage("This election is not currently active.", "warning");
            } else if (!withinTime) {
                showMessage("Voting is outside this election's scheduled time.", "warning");
            } else {
                showMessage("Election details loaded. You can verify your identity.", "info");
            }

        } catch (error) {
            showMessage(error.message, "danger");
        } finally {
            setLoadingDetails(false);
        }
    }

    function handleElectionChange(e) {
        const electionId = e.target.value;

        setSelectedElection(electionId);
        setIdentity("");
        setVerified(false);
        setCandidates([]);
        setSelectedCandidate(null);
        setElectionSummary(null);
        setElectionLive(false);
        setMessage("");

        if (electionId) {
            loadElectionDetails(electionId);
        }
    }

    function showMessage(text, type = "info") {
        setMessage(text);
        setMessageType(type);
    }

    // Connect MetaMask.
    async function connectWallet() {
        try {
            if (!window.ethereum) {
                showMessage("Please install MetaMask first.", "danger");
                return;
            }

            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts"
            });

            if (!accounts || accounts.length === 0) {
                showMessage("No wallet account was selected.", "danger");
                return;
            }

            setWallet(accounts[0]);
            showMessage("MetaMask wallet connected successfully.", "success");

        } catch (error) {
            showMessage(error.message || "Wallet connection failed.", "danger");
        }
    }

    // Verify voter identity using Flask.
    async function verifyVoter() {
        try {
            if (!selectedElection) {
                showMessage("Please select an election first.", "warning");
                return;
            }

            if (!electionLive) {
                showMessage("This election is not currently accepting votes.", "warning");
                return;
            }

            if (!wallet) {
                showMessage("Please connect your MetaMask wallet first.", "warning");
                return;
            }

            if (!identity.trim()) {
                showMessage("Please enter your Aadhaar or Voter ID.", "warning");
                return;
            }

            const response = await fetch(`${API}/verifyVoter`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ identity: identity.trim() })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setVerified(false);
                showMessage(
                    data.message || data.error || "Voter verification failed.",
                    "danger"
                );
                return;
            }

            setVerified(true);
            showMessage("Voter verified successfully. Select your candidate.", "success");

        } catch (error) {
            setVerified(false);
            showMessage(error.message || "Could not verify voter.", "danger");
        }
    }

    // Submit the vote for the selected election.
    async function castVote() {
        try {
            if (!selectedElection || !selectedCandidate || !verified || !wallet) {
                showMessage("Please complete all voting steps first.", "warning");
                return;
            }

            if (!electionLive) {
                showMessage("Voting is currently closed.", "warning");
                return;
            }

            setSubmitting(true);

            const response = await fetch(`${API}/castVote`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    electionId: Number(selectedElection),
                    candidateId: Number(selectedCandidate),
                    identity: identity.trim(),
                    wallet: wallet
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.error || data.message || "Vote could not be recorded."
                );
            }

            showMessage(
                `Your vote was successfully recorded! Transaction: ${data.txHash || "Confirmed"}`,
                "success"
            );

            // Prevent another vote through this page after success.
            setVerified(false);
            setSelectedCandidate(null);
            setIdentity("");

        } catch (error) {
            showMessage(error.message, "danger");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <NavigationBar />

            <Container className="mt-5 mb-5">
                <h1>
                    <FaVoteYea className="me-2" color="#198754" />
                    Cast Your Vote
                </h1>

                <p className="text-muted">
                    Select an election, verify your identity and vote for your
                    preferred candidate.
                </p>

                <hr />

                {message && (
                    <Alert
                        variant={messageType}
                        dismissible
                        onClose={() => setMessage("")}
                    >
                        {message}
                    </Alert>
                )}

                {/* Election Selection */}
                <Card className="p-4 shadow-sm mb-4">
                    <h4>1. Select Election</h4>

                    {loadingElections ? (
                        <Spinner animation="border" className="mt-3" />
                    ) : elections.length === 0 ? (
                        <Alert variant="info" className="mt-3 mb-0">
                            No elections are currently available.
                        </Alert>
                    ) : (
                        <Form.Select
                            className="mt-3"
                            value={selectedElection}
                            onChange={handleElectionChange}
                        >
                            <option value="">Choose an election</option>

                            {elections.map((election) => (
                                <option key={election.id} value={election.id}>
                                    {election.name} (ID: {election.id})
                                </option>
                            ))}
                        </Form.Select>
                    )}

                    {loadingDetails && (
                        <div className="mt-3">
                            <Spinner size="sm" animation="border" />
                            <span className="ms-2">Loading election details...</span>
                        </div>
                    )}

                    {electionSummary && (
                        <Card className="mt-3 bg-light">
                            <Card.Body>
                                <h5>{electionSummary.name}</h5>

                                <p className="mb-1">
                                    Election ID: {selectedElection}
                                </p>

                                <p className="mb-1">
                                    Total Votes: {electionSummary.totalVotes}
                                </p>

                                <p className="mb-0">
                                    Status:{" "}
                                    <Badge bg={electionLive ? "success" : "secondary"}>
                                        {electionLive ? "ACTIVE" : String(electionSummary.state)}
                                    </Badge>
                                </p>
                            </Card.Body>
                        </Card>
                    )}
                </Card>

                {/* Wallet Connection */}
                <Card className="p-4 shadow-sm mb-4">
                    <h4>2. Wallet Connection</h4>

                    <Button
                        onClick={connectWallet}
                        className="mt-3"
                        variant="primary"
                    >
                        {wallet ? "Reconnect MetaMask" : "Connect MetaMask"}
                    </Button>

                    {wallet && (
                        <Alert variant="success" className="mt-3 mb-0">
                            <strong>Connected Wallet:</strong>
                            <br />
                            <small>{wallet}</small>
                        </Alert>
                    )}
                </Card>

                {/* Voter Verification */}
                <Card className="p-4 shadow-sm mb-4">
                    <h4>3. Voter Verification</h4>

                    <Form.Control
                        className="mt-3"
                        placeholder="Enter Aadhaar or Voter ID"
                        value={identity}
                        onChange={(e) => {
                            setIdentity(e.target.value);
                            setVerified(false);
                            setSelectedCandidate(null);
                        }}
                    />

                    <Button
                        className="mt-3"
                        onClick={verifyVoter}
                        disabled={!selectedElection || !electionLive || loadingDetails}
                    >
                        Verify Voter
                    </Button>
                </Card>

                {/* Candidate Selection */}
                {verified && (
                    <div className="mt-5">
                        <h3>4. Choose Your Candidate</h3>

                        {candidates.length === 0 ? (
                            <Alert variant="warning">
                                No candidates are registered for this election.
                            </Alert>
                        ) : (
                            <Row>
                                {candidates.map((candidate) => (
                                    <Col md={4} key={candidate.id} className="mt-3">
                                        <Card
                                            className={
                                                selectedCandidate === candidate.id
                                                    ? "border border-success shadow"
                                                    : "shadow-sm"
                                            }
                                        >
                                            <Card.Body className="text-center">
                                                <h4>👤</h4>
                                                <h5>{candidate.name}</h5>

                                                <Button
                                                    className="mt-3"
                                                    variant={
                                                        selectedCandidate === candidate.id
                                                            ? "success"
                                                            : "outline-success"
                                                    }
                                                    onClick={() =>
                                                        setSelectedCandidate(candidate.id)
                                                    }
                                                >
                                                    {selectedCandidate === candidate.id
                                                        ? "Selected"
                                                        : "Select Candidate"}
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </div>
                )}

                {/* Cast Vote */}
                {verified && selectedCandidate && (
                    <div className="text-center mt-5">
                        <Button
                            size="lg"
                            variant="success"
                            onClick={castVote}
                            disabled={!electionLive || submitting}
                        >
                            {submitting ? (
                                <>
                                    <Spinner size="sm" className="me-2" />
                                    Recording Vote...
                                </>
                            ) : (
                                "Cast Vote"
                            )}
                        </Button>

                        <p className="text-muted mt-3">
                            Please review your candidate selection before submitting.
                            Your vote cannot be changed after it is recorded.
                        </p>
                    </div>
                )}
            </Container>
        </>
    );
}

export default Vote;
