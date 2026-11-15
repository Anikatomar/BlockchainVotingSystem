
import { useEffect, useState } from "react";
import {
    Container,
    Card,
    Row,
    Col,
    Button,
    Badge,
    Alert,
    Spinner
} from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";

const API = "http://127.0.0.1:5000";

function ElectionDetails() {
    const { electionId } = useParams();
    const navigate = useNavigate();

    const [election, setElection] = useState(null);
    const [candidates, setCandidates] = useState([]);
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

    const formatDate = (timestamp) => {
        if (!timestamp) return "Not available";

        return new Date(
            Number(timestamp) * 1000
        ).toLocaleString();
    };

    async function loadElection() {
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
                    summaryData.error || "Could not load election details."
                );
            }

            if (
                !candidatesResponse.ok ||
                !Array.isArray(candidatesData)
            ) {
                throw new Error(
                    candidatesData.error || "Could not load candidates."
                );
            }

            setElection(summaryData);
            setCandidates(candidatesData);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadElection();
    }, [electionId]);

    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" />
                <p className="mt-2">Loading election details...</p>
            </Container>
        );
    }

    if (error || !election) {
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

    const statusVariant = {
        NOT_STARTED: "warning",
        ACTIVE: "success",
        ENDED: "secondary",
        CANCELLED: "danger"
    };

    const isActive = status === "ACTIVE";

    return (
        <Container className="py-5">

            <Button
                variant="outline-secondary"
                className="mb-4"
                onClick={() => navigate("/elections")}
            >
                ← Back to Elections
            </Button>

            {/* Election Information */}
            <Card className="shadow-sm mb-4">
                <Card.Body>

                    <div className="d-flex justify-content-between align-items-start">

                        <div>
                            <h2>{election.name}</h2>

                            <p className="text-muted mb-1">
                                Election ID: {electionId}
                            </p>
                        </div>

                        <Badge bg={statusVariant[status] || "dark"}>
                            {status.replaceAll("_", " ")}
                        </Badge>

                    </div>

                    <hr />

                    <Row>
                        <Col md={4}>
                            <strong>Start Time</strong>
                            <p>{formatDate(election.startTime)}</p>
                        </Col>

                        <Col md={4}>
                            <strong>End Time</strong>
                            <p>{formatDate(election.endTime)}</p>
                        </Col>

                        <Col md={4}>
                            <strong>Total Votes</strong>
                            <p>{election.totalVotes ?? 0}</p>
                        </Col>
                    </Row>

                    <Button
                        variant="outline-primary"
                        onClick={loadElection}
                    >
                        Refresh Details
                    </Button>

                </Card.Body>
            </Card>

            {/* Candidates */}
            <h3 className="mb-3">Election Candidates</h3>

            {candidates.length === 0 ? (

                <Alert variant="info">
                    No candidates have been added to this election yet.
                </Alert>

            ) : (

                <Row>
                    {candidates.map((candidate) => (

                        <Col
                            md={6}
                            lg={4}
                            key={candidate.id}
                            className="mb-3"
                        >

                            <Card className="h-100 shadow-sm">
                                <Card.Body className="text-center">

                                    <h3>👤</h3>

                                    <h5>{candidate.name}</h5>

                                    <p className="text-muted mb-0">
                                        Candidate ID: {candidate.id}
                                    </p>

                                    <p className="mb-0">
                                        Votes: {candidate.voteCount}
                                    </p>

                                </Card.Body>
                            </Card>

                        </Col>

                    ))}
                </Row>

            )}

            {/* Voting Status */}
            <Card className="shadow-sm mt-4">
                <Card.Body>

                    <h4>Voting</h4>

                    {isActive ? (
                        <>
                            <Alert variant="success">
                                This election is currently active.
                            </Alert>

                            <Button
                                variant="success"
                                onClick={() => navigate("/vote")}
                            >
                                Go to Cast Vote
                            </Button>
                        </>
                    ) : (
                        <Alert variant="warning" className="mb-0">
                            Voting is unavailable. This election is currently
                            {` ${status.replaceAll("_", " ").toLowerCase()}`}.
                        </Alert>
                    )}

                </Card.Body>
            </Card>

            {/* Results and Audit */}
            <div className="mt-4">

                <Button
                    variant="outline-primary"
                    onClick={() =>
                        navigate(`/election/${electionId}/results`)
                    }
                >
                    View Results
                </Button>

                <Button
                    variant="outline-dark"
                    className="ms-2"
                    onClick={() =>
                        navigate(`/election/${electionId}/audit`)
                    }
                >
                    View Audit History
                </Button>

            </div>

        </Container>
    );
}

export default ElectionDetails;
