
import { useEffect, useState } from "react";
import {
    Container,
    Card,
    Row,
    Col,
    Table,
    Button,
    Badge,
    Alert,
    Spinner
} from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";

const API = "http://127.0.0.1:5000";

function ElectionResults() {
    const { electionId } = useParams();
    const navigate = useNavigate();

    const [election, setElection] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [winner, setWinner] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const getStatus = (state) => {
        const states = {
            0: "NOT_STARTED",
            1: "ACTIVE",
            2: "ENDED",
            3: "CANCELLED"
        };

        return states[state] || String(state || "UNKNOWN").toUpperCase();
    };

    async function loadResults() {
        try {
            setLoading(true);
            setError("");

            const [summaryResponse, candidatesResponse] =
                await Promise.all([
                    fetch(`${API}/summary/${electionId}`),
                    fetch(`${API}/getCandidates/${electionId}`)
                ]);

            const summaryData = await summaryResponse.json();
            const candidatesData = await candidatesResponse.json();

            if (!summaryResponse.ok) {
                throw new Error(
                    summaryData.error || "Could not load election summary."
                );
            }

            if (
                !candidatesResponse.ok ||
                !Array.isArray(candidatesData)
            ) {
                throw new Error(
                    candidatesData.error || "Could not load candidate results."
                );
            }

            setElection(summaryData);
            setCandidates(candidatesData);

            const status = getStatus(summaryData.state);

            if (status === "ENDED") {
                const winnerResponse = await fetch(
                    `${API}/winner/${electionId}`
                );

                const winnerData = await winnerResponse.json();

                if (!winnerResponse.ok) {
                    throw new Error(
                        winnerData.error || "Could not load winner information."
                    );
                }

                setWinner(winnerData);

            } else {
                setWinner(null);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadResults();
    }, [electionId]);

    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" />
                <p className="mt-2">Loading election results...</p>
            </Container>
        );
    }

    if (!election) {
        return (
            <Container className="py-5">
                <Alert variant="danger">
                    {error || "Election not found."}
                </Alert>

                <Button onClick={() => navigate("/elections")}>
                    Back to Elections
                </Button>
            </Container>
        );
    }

    const status = getStatus(election.state);

    const resultsPublished = status === "ENDED";
    const cancelled = status === "CANCELLED";

    // Support common winner response formats.
    const winnerData = winner?.winner || winner;

    const winnerName = winnerData
        ? (
            winnerData.name ||
            winnerData.candidateName ||
            winnerData.winnerName ||
            winnerData[1] ||
            null
        )
        : null;

    const winnerVotes = winnerData
        ? (
            winnerData.voteCount ??
            winnerData.votes ??
            winnerData[2] ??
            null
        )
        : null;

    const statusVariant = {
        NOT_STARTED: "warning",
        ACTIVE: "success",
        ENDED: "secondary",
        CANCELLED: "danger"
    };

    const sortedCandidates = [...candidates].sort(
    (a, b) => Number(b.votes ?? 0) - Number(a.votes ?? 0)
    );

    return (
        <Container className="py-5">

            <Button
                variant="outline-secondary"
                className="mb-4"
                onClick={() => navigate(`/election/${electionId}`)}
            >
                ← Back to Election
            </Button>

            {/* Election Heading */}
            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>
                    <h2>Election Results</h2>

                    <p className="text-muted mb-0">
                        {election.name}
                    </p>

                    <small className="text-muted">
                        Election ID: {electionId}
                    </small>
                </div>

                <Badge bg={statusVariant[status] || "dark"}>
                    {status.replaceAll("_", " ")}
                </Badge>

            </div>

            {error && (
                <Alert variant="danger">
                    {error}
                </Alert>
            )}

            {/* Election Status Messages */}
            {!resultsPublished && !cancelled && (
                <Alert variant="info">
                    Final results and the winner will be available once
                    this election has ended.

                    <br />

                    The vote counts shown below may change while voting is active.
                </Alert>
            )}

            {cancelled && (
                <Alert variant="danger">
                    This election has been cancelled.
                </Alert>
            )}

            {/* Winner */}
            {resultsPublished && winnerName && (
                <Card className="shadow-sm mb-4 border-success">
                    <Card.Body className="text-center py-4">

                        <h5 className="text-muted">
                            🏆 Election Winner
                        </h5>

                        <h2 className="text-success">
                            {winnerName}
                        </h2>

                        {winnerVotes !== null && (
                            <p className="mb-0">
                                Votes received:{" "}
                                <strong>{String(winnerVotes)}</strong>
                            </p>
                        )}

                    </Card.Body>
                </Card>
            )}

            {resultsPublished && !winnerName && (
                <Alert variant="warning">
                    The election has ended, but winner information
                    could not be displayed. Please check the backend
                    winner response.
                </Alert>
            )}

            {/* Summary Cards */}
            <Row className="mb-4">

                <Col md={6} className="mb-3">
                    <Card className="shadow-sm h-100">
                        <Card.Body>
                            <h6 className="text-muted">
                                Total Votes
                            </h6>

                            <h2>
                                {election.totalVotes ?? 0}
                            </h2>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} className="mb-3">
                    <Card className="shadow-sm h-100">
                        <Card.Body>
                            <h6 className="text-muted">
                                Number of Candidates
                            </h6>

                            <h2>
                                {candidates.length}
                            </h2>
                        </Card.Body>
                    </Card>
                </Col>

            </Row>

            {/* Candidate-wise Results */}
            <Card className="shadow-sm">

                <Card.Body>

                    <h4 className="mb-3">
                        Candidate-wise Results
                    </h4>

                    {candidates.length === 0 ? (

                        <Alert variant="info">
                            No candidates found for this election.
                        </Alert>

                    ) : (

                        <Table responsive striped bordered hover>

                            <thead>
                                <tr>
                                    <th>Candidate ID</th>
                                    <th>Candidate Name</th>
                                    <th>Votes</th>
                                </tr>
                            </thead>

                            <tbody>
                                {sortedCandidates.map((candidate) => (

                                    <tr key={candidate.id}>
                                        <td>{candidate.id}</td>

                                        <td>{candidate.name}</td>

                                        <td>{candidate.votes ?? 0}</td>
                                    </tr>

                                ))}
                            </tbody>

                        </Table>

                    )}

                </Card.Body>

            </Card>

            <Button
                className="mt-3"
                variant="outline-primary"
                onClick={loadResults}
                disabled={loading}
            >
                Refresh Results
            </Button>

        </Container>
    );
}

export default ElectionResults;
