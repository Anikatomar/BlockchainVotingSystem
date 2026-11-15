
import { useEffect, useState } from "react";
import {
    Container, Card, Table, Button,
    Alert, Spinner, Badge
} from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";

const API = "http://127.0.0.1:5000";

function AuditHistory() {
    const { electionId } = useParams();
    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadAuditHistory = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(`${API}/auditHistory/${electionId}`);
            const data = await response.json();

            if (!response.ok || !Array.isArray(data)) {
                throw new Error(data.error || "Could not fetch audit history");
            }

            setEvents(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAuditHistory();
    }, [electionId]);

    const formatEventName = (event) => {
        const name = event.event || event.eventName || event.name || "Blockchain Event";

        return String(name)
            .replace(/([A-Z])/g, " $1")
            .trim();
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return "Not available";

        // Supports Unix timestamps in seconds or milliseconds.
        const value = Number(timestamp);
        const milliseconds = value < 100000000000 ? value * 1000 : value;

        return new Date(milliseconds).toLocaleString();
    };

    const getEventVariant = (event) => {
        const name = formatEventName(event).toLowerCase();

        if (name.includes("vote")) return "success";
        if (name.includes("cancel")) return "danger";
        if (name.includes("propos") || name.includes("approv")) return "warning";
        if (name.includes("start") || name.includes("final")) return "primary";

        return "secondary";
    };

    return (
        <Container className="py-5">
            <Button
                variant="outline-secondary"
                className="mb-4"
                onClick={() => navigate(`/election/${electionId}`)}
            >
                ← Back to Election
            </Button>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>Blockchain Audit History</h2>
                    <p className="text-muted mb-0">
                        Election ID: {electionId}
                    </p>
                </div>

                <Button variant="outline-primary" onClick={loadAuditHistory}>
                    Refresh
                </Button>
            </div>

            <Alert variant="info">
                This page displays recorded smart contract events for this election.
                Each event is associated with blockchain transaction data.
            </Alert>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" />
                    <p className="mt-2">Fetching blockchain events...</p>
                </div>
            ) : events.length === 0 ? (
                <Alert variant="warning">
                    No audit events were found for this election.
                </Alert>
            ) : (
                <Card className="shadow-sm">
                    <Card.Body>
                        <div className="d-flex justify-content-between mb-3">
                            <h5>Event Records</h5>
                            <Badge bg="dark">{events.length} Events</Badge>
                        </div>

                        <Table responsive bordered hover striped>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Event</th>
                                    <th>Block Number</th>
                                    <th>Transaction Hash</th>
                                    <th>Event Details</th>
                                </tr>
                            </thead>

                            <tbody>
                                {events.map((event, index) => {
                                    const details = event.args || event.details || {};

                                    return (
                                        <tr key={`${event.transactionHash || "event"}-${index}`}>
                                            <td>{index + 1}</td>

                                            <td>
                                                <Badge bg={getEventVariant(event)}>
                                                    {formatEventName(event)}
                                                </Badge>
                                            </td>

                                            <td>
                                                {event.blockNumber ?? "—"}
                                            </td>

                                            <td style={{ maxWidth: "180px", wordBreak: "break-all" }}>
                                                {event.transactionHash || "—"}
                                            </td>

                                            <td>
                                                <details>
                                                    <summary>View details</summary>
                                                    <pre
                                                        className="mt-2 mb-0"
                                                        style={{
                                                            whiteSpace: "pre-wrap",
                                                            wordBreak: "break-word"
                                                        }}
                                                    >
                                                        {JSON.stringify(details, null, 2)}
                                                    </pre>
                                                </details>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
}

export default AuditHistory;
