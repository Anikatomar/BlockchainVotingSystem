import NavigationBar from "../components/layout/Navbar";
import { FaChartBar } from "react-icons/fa";
import { useState, useEffect } from "react";
import { Card, Row, Col, Table, ProgressBar } from "react-bootstrap";
function LiveDashboard() {
  const [summary, setSummary] = useState(null);

const [leader, setLeader] = useState(null);

const [candidates, setCandidates] = useState([]);
async function loadDashboard() {

    try {

        const summaryResponse = await fetch(
            "http://127.0.0.1:5000/summary"
        );

        const leaderResponse = await fetch(
            "http://127.0.0.1:5000/currentLeader"
        );

        const candidateResponse = await fetch(
            "http://127.0.0.1:5000/getCandidates"
        );

        setSummary(await summaryResponse.json());

        setLeader(await leaderResponse.json());

        setCandidates(await candidateResponse.json());

    }

    catch (error) {

        console.log(error);

    }

}
useEffect(() => {

    loadDashboard();

    const interval = setInterval(loadDashboard, 3000);

    return () => clearInterval(interval);

}, []);
  return (
    <>
      <NavigationBar />

      <div className="container mt-5">

        <h1>
  <FaChartBar color="#fd7e14" className="me-2" />
  Live Dashboard
</h1>
        <hr />

        <Row>

    <Col md={4}>

        <Card className="shadow p-4">

            <h5>Election Status</h5>

            <h3>

                {

                    summary?.started

                        ? "🟢 LIVE"

                        : "🔴 CLOSED"

                }

            </h3>

        </Card>

    </Col>

    <Col md={4}>

        <Card className="shadow p-4">

            <h5>Total Votes</h5>

            <h2>

                {summary?.totalVotes}

            </h2>

        </Card>

    </Col>

    <Col md={4}>

        <Card className="shadow p-4">

            <h5>Current Leader</h5>

            <h3>

                {leader?.name || "-"}

            </h3>

            <small>

                Votes: {leader?.votes ?? 0}

            </small>

        </Card>

    </Col>

</Row>

        <Card className="shadow mt-5 p-4">

    <h3>Candidate Standings</h3>

    <Table striped hover bordered className="mt-4">

        <thead>

            <tr>

                <th>ID</th>

                <th>Name</th>

                <th>Votes</th>

                <th>Vote Share</th>

            </tr>

        </thead>

        <tbody>

            {

                candidates.map(candidate => {

                    const totalVotes = summary?.totalVotes || 0;

                    const percentage =

                        totalVotes === 0

                            ? 0

                            : (candidate.votes / totalVotes) * 100;

                    return (

                        <tr key={candidate.id}>

                            <td>{candidate.id}</td>

                            <td>{candidate.name}</td>

                            <td>{candidate.votes}</td>

                            <td style={{ width: "250px" }}>

                                <ProgressBar

                                    now={percentage}

                                    label={`${percentage.toFixed(1)}%`}

                                />

                            </td>

                        </tr>

                    );

                })

            }

        </tbody>

    </Table>

</Card>

      </div>
    </>
  );
}

export default LiveDashboard;