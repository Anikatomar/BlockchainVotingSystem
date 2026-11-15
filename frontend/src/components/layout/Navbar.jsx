
import { Navbar, Container, Badge, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

function NavigationBar() {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState("");
  const [electionStatus, setElectionStatus] = useState("UNKNOWN");

  async function loadElections() {
    try {
      const response = await fetch("http://127.0.0.1:5000/elections");
      if (!response.ok) throw new Error("Could not load elections");

      const data = await response.json();
      const list = Array.isArray(data) ? data : data.elections || [];

      setElections(list);

      setSelectedElection((previous) => {
        if (previous && list.some(
          (election) => String(election.id) === String(previous)
        )) {
          return previous;
        }

        return list.length ? String(list[0].id) : "";
      });
    } catch (error) {
      console.error("Election loading error:", error);
    }
  }

  async function loadElectionStatus() {
    if (!selectedElection) {
      setElectionStatus("UNKNOWN");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/summary/${selectedElection}`
      );

      if (!response.ok) throw new Error("Could not load election status");

      const data = await response.json();

      setElectionStatus(
        String(data.state ?? data.status ?? "UNKNOWN").toUpperCase()
      );
    } catch (error) {
      console.error("Status loading error:", error);
    }
  }

  useEffect(() => {
    loadElections();
  }, []);

  useEffect(() => {
    if (!selectedElection) return;

    loadElectionStatus();

    const interval = setInterval(loadElectionStatus, 5000);

    return () => clearInterval(interval);
  }, [selectedElection]);

  const statusColor =
    electionStatus === "ACTIVE"
      ? "success"
      : electionStatus === "UNKNOWN"
      ? "secondary"
      : "danger";

  return (
    <Navbar
      bg="dark"
      variant="dark"
      expand="lg"
      sticky="top"
      className="shadow-sm"
    >
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          🗳 Blockchain Voting System
        </Navbar.Brand>

        <div className="d-flex align-items-center gap-2">
          <Form.Select
            size="sm"
            value={selectedElection}
            onChange={(e) => setSelectedElection(e.target.value)}
            style={{ width: "150px" }}
          >
            {elections.length === 0 && (
              <option value="">No elections</option>
            )}

            {elections.map((election) => (
              <option key={election.id} value={election.id}>
                {election.name}
              </option>
            ))}
          </Form.Select>

          <span className="text-light">
            Election Status
          </span>

          <Badge bg={statusColor}>
            {electionStatus === "ACTIVE"
              ? "LIVE"
              : electionStatus === "UNKNOWN"
              ? "UNKNOWN"
              : electionStatus}
          </Badge>
        </div>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;
