
import NavigationBar from "../components/layout/Navbar";
import { FaChartBar } from "react-icons/fa";
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  ProgressBar,
  Form,
  Alert,
  Spinner,
  Button
} from "react-bootstrap";

function LiveDashboard() {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState("");
  const [summary, setSummary] = useState(null);
  const [leader, setLeader] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load all elections
  const loadElections = useCallback(async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/elections");

      if (!response.ok) {
        throw new Error("Unable to load elections");
      }

      const data = await response.json();
      const electionList = Array.isArray(data)
        ? data
        : data.elections || [];

      setElections(electionList);

      // Select the first election automatically
      setSelectedElection((previous) => {
        if (
          previous &&
          electionList.some(
            (election) => String(election.id) === String(previous)
          )
        ) {
          return previous;
        }

        return electionList.length
          ? String(electionList[0].id)
          : "";
      });
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Load data for the selected election
  const loadDashboard = useCallback(async () => {
    if (!selectedElection) {
      setLoading(false);
      return;
    }

    try {
      const electionId = selectedElection;

      const [summaryResponse, leaderResponse, candidateResponse] =
        await Promise.all([
          fetch(`http://127.0.0.1:5000/summary/${electionId}`),
          fetch(`http://127.0.0.1:5000/currentLeader/${electionId}`),
          fetch(`http://127.0.0.1:5000/getCandidates/${electionId}`)
        ]);

      if (
        !summaryResponse.ok ||
        !leaderResponse.ok ||
        !candidateResponse.ok
      ) {
        throw new Error("Unable to fetch election details");
      }

      const summaryData = await summaryResponse.json();
      const leaderData = await leaderResponse.json();
      const candidateData = await candidateResponse.json();

      setSummary(summaryData);
      setLeader(leaderData);
      setCandidates(
        Array.isArray(candidateData) ? candidateData : []
      );

      setError("");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedElection]);

  // Initial election list
  useEffect(() => {
    loadElections();
  }, [loadElections]);

  // Refresh selected election every 3 seconds
  useEffect(() => {
    if (!selectedElection) return;

    setLoading(true);
    loadDashboard();

    const interval = setInterval(loadDashboard, 3000);

    return () => clearInterval(interval);
  }, [selectedElection, loadDashboard]);

  const totalVotes = Number(summary?.totalVotes ?? 0);

  const electionStatus = String(
    summary?.state ?? summary?.status ?? "UNKNOWN"
  ).toUpperCase();

  const isLive = electionStatus === "ACTIVE";

  return (
    <>
      <NavigationBar />

      <div className="container mt-5">
        <h1>
          <FaChartBar color="#fd7e14" className="me-2" />
          Live Dashboard
        </h1>

        <hr />

        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        {/* Election selector */}
        <Card className="shadow p-3 mb-4">
          <Row className="align-items-center">
            <Col md={3}>
              <h5 className="mb-md-0">Select Election</h5>
            </Col>

            <Col md={6}>
              <Form.Select
                value={selectedElection}
                onChange={(e) => setSelectedElection(e.target.value)}
              >
                <option value="">Choose an election</option>

                {elections.map((election) => (
                  <option key={election.id} value={election.id}>
                    {election.name} (ID: {election.id})
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col md={3}>
              <Button
                variant="outline-primary"
                className="mt-2 mt-md-0"
                onClick={() => {
                  loadElections();
                  loadDashboard();
                }}
              >
                Refresh
              </Button>
            </Col>
          </Row>
        </Card>

        {!selectedElection && (
          <Alert variant="info">
            No elections available. Create an election from the Admin Dashboard first.
          </Alert>
        )}

        {loading && selectedElection && !summary && (
          <div className="text-center mt-4">
            <Spinner animation="border" />
            <p>Loading election data...</p>
          </div>
        )}

        {summary && (
          <>
            <Row>
              <Col md={4}>
                <Card className="shadow p-4 mb-3">
                  <h5>Election Status</h5>
                  <h3>
                    {isLive ? "🟢 LIVE" : `🔴 ${electionStatus}`}
                  </h3>
                </Card>
              </Col>

              <Col md={4}>
                <Card className="shadow p-4 mb-3">
                  <h5>Total Votes</h5>
                  <h2>{totalVotes}</h2>
                </Card>
              </Col>

              <Col md={4}>
                <Card className="shadow p-4 mb-3">
                  <h5>Current Leader</h5>
                  <h3>{leader?.name || "-"}</h3>
                  <small>
                    Votes: {leader?.votes ?? leader?.voteCount ?? 0}
                  </small>
                </Card>
              </Col>
            </Row>

            <Card className="shadow mt-4 p-4">
              <h3>Candidate Standings</h3>

              <Table striped hover bordered responsive className="mt-4">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Votes</th>
                    <th>Vote Share</th>
                  </tr>
                </thead>

                <tbody>
                  {candidates.length > 0 ? (
                    candidates.map((candidate) => {
                      const votes = Number(
                        candidate.votes ?? candidate.voteCount ?? 0
                      );

                      const percentage =
                        totalVotes === 0
                          ? 0
                          : (votes / totalVotes) * 100;

                      return (
                        <tr key={candidate.id}>
                          <td>{candidate.id}</td>
                          <td>{candidate.name}</td>
                          <td>{votes}</td>
                          <td style={{ minWidth: "250px" }}>
                            <ProgressBar
                              now={percentage}
                              label={`${percentage.toFixed(1)}%`}
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center">
                        No candidates added to this election yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card>
          </>
        )}
      </div>
    </>
  );
}

export default LiveDashboard;
