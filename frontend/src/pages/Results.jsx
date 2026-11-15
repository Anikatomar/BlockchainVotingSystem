
import NavigationBar from "../components/layout/Navbar";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Alert,
  Spinner
} from "react-bootstrap";
import { FaTrophy } from "react-icons/fa";

function Results() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadElections() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:5000/elections"
      );

      if (!response.ok) {
        throw new Error("Unable to load elections");
      }

      const data = await response.json();

      setElections(
        Array.isArray(data) ? data : data.elections || []
      );
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadElections();
  }, []);

  function getStatusColor(status) {
    switch (String(status).toUpperCase()) {
      case "ACTIVE":
        return "success";
      case "ENDED":
        return "secondary";
      case "CANCELLED":
        return "danger";
      default:
        return "warning";
    }
  }

  return (
    <>
      <NavigationBar />

      <Container className="mt-5 mb-5">
        <Row className="align-items-center mb-4">
          <Col>
            <h1>
              <FaTrophy className="me-2 text-warning" />
              Election Results
            </h1>

            <p className="text-muted">
              Select an election to view its candidate-wise
              results and winner.
            </p>
          </Col>

          <Col xs="auto">
            <Button
              variant="outline-primary"
              onClick={loadElections}
            >
              Refresh
            </Button>
          </Col>
        </Row>

        <hr />

        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="text-center mt-5">
            <Spinner animation="border" />
            <p className="mt-2">Loading elections...</p>
          </div>
        ) : elections.length === 0 ? (
          <Alert variant="info">
            No elections are available yet.
          </Alert>
        ) : (
          <Row className="g-4">
            {elections.map((election) => (
              <Col md={6} lg={4} key={election.id}>
                <Card className="shadow-sm h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <Card.Title>
                        {election.name}
                      </Card.Title>

                      <Badge bg={getStatusColor(election.state ?? election.status)}>
                        {election.state ?? election.status ?? "UNKNOWN"}
                      </Badge>
                    </div>

                    <hr />

                    <p>
                      <strong>Election ID:</strong>{" "}
                      {election.id}
                    </p>

                    <p>
                      <strong>Total Votes:</strong>{" "}
                      {election.totalVotes ?? 0}
                    </p>

                    <Button
                      as={Link}
                      to={`/election/${election.id}/results`}
                      variant="primary"
                      className="w-100 mt-2"
                    >
                      View Results
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </>
  );
}

export default Results;
