
import { useEffect, useState } from "react";
import { Container, Card, Row, Col, Button, Badge, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function Elections() {
    const [elections, setElections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        fetchElections();
    }, []);

    const fetchElections = async () => {
        try {
            setLoading(true);

            const response = await fetch("http://127.0.0.1:5000/elections");
            const data = await response.json();

            if (!response.ok || !Array.isArray(data)) {
                throw new Error(data.error || "Unable to load elections");
            }

            setElections(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatus = (state) => {
        const states = {
            0: "NOT_STARTED",
            1: "ACTIVE",
            2: "ENDED",
            3: "CANCELLED"
        };

        return states[state] || state || "UNKNOWN";
    };

    const getVariant = (state) => {
        const status = getStatus(state);

        if (status === "ACTIVE") return "success";
        if (status === "ENDED") return "secondary";
        if (status === "CANCELLED") return "danger";

        return "warning";
    };

    const formatDate = (timestamp) => {
        return new Date(Number(timestamp) * 1000).toLocaleString();
    };

    return (
        <Container className="py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>Available Elections</h2>
                    <p className="text-muted">
                        Browse elections and participate in the voting process.
                    </p>
                </div>

                <Button variant="outline-primary" onClick={fetchElections}>
                    Refresh
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" />
                    <p className="mt-2">Loading elections...</p>
                </div>
            ) : elections.length === 0 ? (
                <Alert variant="info">
                    No elections have been created yet.
                </Alert>
            ) : (
                <Row>
                    {elections.map((election) => {
                        const status = getStatus(election.state);

                        return (
                            <Col md={6} lg={4} key={election.id} className="mb-4">
                                <Card className="h-100 shadow-sm">
                                    <Card.Body>
                                        <Card.Title>
                                            {election.name}
                                        </Card.Title>

                                        <Badge bg={getVariant(election.state)}>
                                            {status.replace("_", " ")}
                                        </Badge>

                                        <hr />

                                        <p>
                                            <strong>Election ID:</strong>{" "}
                                            {election.id}
                                        </p>

                                        <p>
                                            <strong>Starts:</strong><br />
                                            {formatDate(election.startTime)}
                                        </p>

                                        <p>
                                            <strong>Ends:</strong><br />
                                            {formatDate(election.endTime)}
                                        </p>

                                        <p>
                                            <strong>Total Votes:</strong>{" "}
                                            {election.totalVotes}
                                        </p>

                                        <Button
                                            variant="primary"
                                            className="w-100 mt-2"
                                            onClick={() =>
                                                navigate(`/election/${election.id}`)
                                            }
                                        >
                                            View Election
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}
        </Container>
    );
}

export default Elections;
