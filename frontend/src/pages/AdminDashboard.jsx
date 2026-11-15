
import { useState, useEffect } from "react";

import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Form,
    Alert,
    Table,
    Badge
} from "react-bootstrap";

function AdminDashboard() {

    // ----------------------------------
    // STATES
    // ----------------------------------

    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");

    const [elections, setElections] = useState([]);
    const [selectedElection, setSelectedElection] = useState("");

    const [electionName, setElectionName] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    const [candidateName, setCandidateName] = useState("");
    const [candidates, setCandidates] = useState([]);

    const [electionState, setElectionState] = useState(null);
    const [electionSummary, setElectionSummary] = useState(null);

    const [loading, setLoading] = useState(false);


    // ----------------------------------
    // ELECTION STATE HELPERS
    // ----------------------------------

    function getStateName(state) {

        const states = {
            0: "NOT_STARTED",
            1: "ACTIVE",
            2: "ENDED",
            3: "CANCELLED"
        };

        return typeof state === "number"
            ? states[state] || "UNKNOWN"
            : state || "UNKNOWN";
    }

    function getBadgeVariant(state) {

        switch (getStateName(state)) {
            case "ACTIVE":
                return "success";

            case "ENDED":
                return "secondary";

            case "CANCELLED":
                return "danger";

            case "NOT_STARTED":
                return "warning";

            default:
                return "dark";
        }
    }

    const electionLive = getStateName(electionState) === "ACTIVE";

    const canAddCandidates =
        getStateName(electionState) === "NOT_STARTED";


    // ----------------------------------
    // LOAD ALL ELECTIONS
    // ----------------------------------

    useEffect(() => {
        loadElections();
    }, []);

    async function loadElections() {

        try {

            const response = await fetch(
                "http://127.0.0.1:5000/elections"
            );

            const data = await response.json();

            if (!response.ok || !Array.isArray(data)) {
                setMessage(data.error || "Unable to load elections.");
                return;
            }

            setElections(data);

            // Automatically select the first election
            if (data.length > 0) {

                setSelectedElection((previous) => {

                    if (
                        previous &&
                        data.some(e => String(e.id) === String(previous))
                    ) {
                        return previous;
                    }

                    return String(data[0].id);
                });

            } else {

                setSelectedElection("");
                setCandidates([]);
                setElectionState(null);
                setElectionSummary(null);

            }

        } catch (error) {

            console.error(error);
            setMessage("Unable to connect to the backend.");

        }
    }


    // ----------------------------------
    // LOAD SELECTED ELECTION DETAILS
    // ----------------------------------

    useEffect(() => {

        if (selectedElection) {
            loadElectionDetails(selectedElection);
        }

    }, [selectedElection]);


    async function loadElectionDetails(electionId) {

        try {

            const [summaryResponse, candidatesResponse] =
                await Promise.all([

                    fetch(
                        `http://127.0.0.1:5000/summary/${electionId}`
                    ),

                    fetch(
                        `http://127.0.0.1:5000/getCandidates/${electionId}`
                    )

                ]);

            const summary = await summaryResponse.json();
            const candidateData = await candidatesResponse.json();

            if (!summaryResponse.ok || summary.success === false) {
                setMessage(summary.error || "Unable to load election details.");
                return;
            }

            setElectionSummary(summary);
            setElectionState(summary.state);

            if (Array.isArray(candidateData)) {
                setCandidates(candidateData);
            } else {
                setCandidates([]);
                setMessage(
                    candidateData.error || "Unable to load candidates."
                );
            }

        } catch (error) {

            console.error(error);
            setMessage("Unable to load selected election.");

        }
    }


    // ----------------------------------
    // CREATE NEW ELECTION
    // ----------------------------------

    async function createElection() {

        if (!electionName.trim() || !startTime || !endTime) {
            setMessage("Please fill in all election details.");
            return;
        }

        const startTimestamp = Math.floor(
            new Date(startTime).getTime() / 1000
        );

        const endTimestamp = Math.floor(
            new Date(endTime).getTime() / 1000
        );

        if (
            !Number.isFinite(startTimestamp) ||
            !Number.isFinite(endTimestamp)
        ) {
            setMessage("Please enter valid election dates.");
            return;
        }

        if (startTimestamp <= Math.floor(Date.now() / 1000)) {
            setMessage("Election start time must be in the future.");
            return;
        }

        if (endTimestamp <= startTimestamp) {
            setMessage("End time must be after start time.");
            return;
        }

        setLoading(true);

        try {

            const response = await fetch(
                "http://127.0.0.1:5000/createElection",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        name: electionName,
                        startTime: startTimestamp,
                        endTime: endTimestamp
                    })
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {

                setMessage("Election created successfully!");

                setElectionName("");
                setStartTime("");
                setEndTime("");

                await loadElections();

                if (data.electionId) {
                    setSelectedElection(String(data.electionId));
                }

            } else {

                setMessage(
                    data.error || data.message || "Failed to create election."
                );

            }

        } catch (error) {

            console.error(error);
            setMessage("Unable to connect to the backend.");

        } finally {

            setLoading(false);

        }
    }


    // ----------------------------------
    // UPLOAD VERIFIED VOTERS CSV
    // ----------------------------------

    async function uploadCSV() {

        if (!file) {
            setMessage("Please choose a CSV file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {

            const response = await fetch(
                "http://127.0.0.1:5000/uploadVoters",
                {
                    method: "POST",
                    body: formData
                }
            );

            const data = await response.json();

            if (response.ok) {

                setMessage(
                    `Imported ${data.imported} voters | Rejected ${data.rejected}`
                );

            } else {

                setMessage(data.error || "CSV upload failed.");

            }

        } catch (error) {

            console.error(error);
            setMessage("Unable to upload CSV.");

        }
    }


    // ----------------------------------
    // ADD CANDIDATE TO SELECTED ELECTION
    // ----------------------------------

    async function addCandidate() {

        if (!selectedElection) {
            setMessage("Please select an election first.");
            return;
        }

        if (!candidateName.trim()) {
            setMessage("Candidate name cannot be empty.");
            return;
        }

        try {

            const response = await fetch(
                "http://127.0.0.1:5000/addCandidate",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        electionId: Number(selectedElection),
                        name: candidateName.trim()
                    })
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {

                setMessage("Candidate added successfully!");
                setCandidateName("");

                await loadElectionDetails(selectedElection);

            } else {

                setMessage(
                    data.error || data.message || "Failed to add candidate."
                );

            }

        } catch (error) {

            console.error(error);
            setMessage("Unable to add candidate.");

        }
    }


    // ----------------------------------
    // START SELECTED ELECTION
    // ----------------------------------

    async function startElection() {

        if (!selectedElection) {
            setMessage("Please select an election first.");
            return;
        }

        if (!window.confirm("Are you sure you want to start this election?")) {
            return;
        }

        try {

            const response = await fetch(
                "http://127.0.0.1:5000/startElection",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        electionId: Number(selectedElection)
                    })
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {

                setMessage("Election started successfully!");

                await loadElectionDetails(selectedElection);
                await loadElections();

            } else {

                setMessage(
                    data.error || data.message || "Failed to start election."
                );

            }

        } catch (error) {

            console.error(error);
            setMessage("Unable to start election.");

        }
    }


    // ----------------------------------
    // FINALIZE SELECTED ELECTION
    // ----------------------------------

    async function finalizeElection() {

        if (!selectedElection) {
            setMessage("Please select an election first.");
            return;
        }

        if (!window.confirm("Are you sure you want to finalize this election?")) {
            return;
        }

        try {

            const response = await fetch(
                "http://127.0.0.1:5000/finalizeElection",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        electionId: Number(selectedElection)
                    })
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {

                setMessage("Election finalized successfully!");

                await loadElectionDetails(selectedElection);
                await loadElections();

            } else {

                setMessage(
                    data.error || data.message || "Failed to finalize election."
                );

            }

        } catch (error) {

            console.error(error);
            setMessage("Unable to finalize election.");

        }
    }


    // ----------------------------------
    // FORMAT DATE
    // ----------------------------------

    function formatDate(timestamp) {

        if (!timestamp) return "Not available";

        return new Date(timestamp * 1000).toLocaleString();

    }


    // ----------------------------------
    // UI
    // ----------------------------------

    return (

        <Container className="py-4">

            <h2 className="mb-4 text-center">
                Election Administrator Dashboard
            </h2>

            {message && (
                <Alert
                    variant="info"
                    dismissible
                    onClose={() => setMessage("")}
                >
                    {message}
                </Alert>
            )}

            <Row className="g-4">

                {/* CREATE ELECTION */}

                <Col lg={6}>

                    <Card className="shadow h-100">

                        <Card.Body>

                            <h5>➕ Create New Election</h5>

                            <Form.Group className="mt-3">

                                <Form.Label>Election Name</Form.Label>

                                <Form.Control
                                    type="text"
                                    placeholder="Enter election name"
                                    value={electionName}
                                    onChange={(e) => setElectionName(e.target.value)}
                                />

                            </Form.Group>

                            <Form.Group className="mt-3">

                                <Form.Label>Start Date and Time</Form.Label>

                                <Form.Control
                                    type="datetime-local"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />

                            </Form.Group>

                            <Form.Group className="mt-3">

                                <Form.Label>End Date and Time</Form.Label>

                                <Form.Control
                                    type="datetime-local"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />

                            </Form.Group>

                            <Button
                                className="mt-3 w-100"
                                onClick={createElection}
                                disabled={loading}
                            >
                                {loading ? "Creating..." : "Create Election"}
                            </Button>

                        </Card.Body>

                    </Card>

                </Col>


                {/* UPLOAD VOTERS */}

                <Col lg={6}>

                    <Card className="shadow h-100">

                        <Card.Body>

                            <h5>📂 Verified Voters</h5>

                            <p className="text-muted">
                                Upload your registered voters using a CSV file.
                            </p>

                            <Form.Control
                                type="file"
                                accept=".csv"
                                className="mt-3"
                                onChange={(e) => setFile(e.target.files[0])}
                            />

                            <Button
                                className="mt-3 w-100"
                                onClick={uploadCSV}
                            >
                                Upload CSV
                            </Button>

                        </Card.Body>

                    </Card>

                </Col>

            </Row>


            {/* ALL ELECTIONS */}

            <Card className="shadow mt-4">

                <Card.Body>

                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">

                        <h5>📋 All Elections</h5>

                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={loadElections}
                        >
                            Refresh Elections
                        </Button>

                    </div>

                    {elections.length === 0 ? (

                        <p className="text-muted mt-3">
                            No elections created yet.
                        </p>

                    ) : (

                        <Table responsive bordered hover className="mt-3">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Election Name</th>
                                    <th>Status</th>
                                    <th>Total Votes</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>

                                {elections.map((election) => (

                                    <tr key={election.id}>

                                        <td>{election.id}</td>

                                        <td>{election.name}</td>

                                        <td>
                                            <Badge bg={getBadgeVariant(election.state)}>
                                                {getStateName(election.state)}
                                            </Badge>
                                        </td>

                                        <td>{election.totalVotes}</td>

                                        <td>

                                            <Button
                                                size="sm"
                                                variant={
                                                    String(selectedElection) === String(election.id)
                                                        ? "primary"
                                                        : "outline-primary"
                                                }
                                                onClick={() => setSelectedElection(String(election.id))}
                                            >
                                                Manage
                                            </Button>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </Table>

                    )}

                </Card.Body>

            </Card>


            {/* SELECTED ELECTION DETAILS */}

            {selectedElection && electionSummary && (

                <>

                    <Card className="shadow mt-4">

                        <Card.Body>

                            <h4>
                                🗳 Managing: {electionSummary.name}
                            </h4>

                            <p className="mb-1">
                                <strong>Election ID:</strong> {selectedElection}
                            </p>

                            <p className="mb-1">
                                <strong>Start:</strong> {formatDate(electionSummary.startTime)}
                            </p>

                            <p className="mb-1">
                                <strong>End:</strong> {formatDate(electionSummary.endTime)}
                            </p>

                            <p className="mb-1">
                                <strong>Total Votes:</strong> {electionSummary.totalVotes}
                            </p>

                            <p>
                                <strong>Status:</strong>{" "}
                                <Badge bg={getBadgeVariant(electionState)}>
                                    {getStateName(electionState)}
                                </Badge>
                            </p>

                        </Card.Body>

                    </Card>


                    <Row className="g-4 mt-1">

                        {/* CANDIDATE MANAGEMENT */}

                        <Col lg={6}>

                            <Card className="shadow h-100">

                                <Card.Body>

                                    <h5>👥 Candidate Management</h5>

                                    <Form.Control
                                        className="mt-3"
                                        placeholder="Candidate Name"
                                        value={candidateName}
                                        onChange={(e) => setCandidateName(e.target.value)}
                                        disabled={!canAddCandidates}
                                    />

                                    <Button
                                        className="mt-2"
                                        onClick={addCandidate}
                                        disabled={!canAddCandidates}
                                    >
                                        Add Candidate
                                    </Button>

                                    {!canAddCandidates && (

                                        <Alert variant="warning" className="mt-3">
                                            Candidates can only be added before the election starts.
                                        </Alert>

                                    )}

                                    <hr />

                                    <h6>Election Candidates</h6>

                                    {candidates.length === 0 ? (

                                        <p>No candidates added yet.</p>

                                    ) : (

                                        candidates.map((candidate) => (

                                            <Card
                                                key={candidate.id}
                                                className="mb-2"
                                            >

                                                <Card.Body>

                                                    <strong>{candidate.name}</strong>

                                                    <br />

                                                    Votes: {candidate.votes}

                                                </Card.Body>

                                            </Card>

                                        ))

                                    )}

                                </Card.Body>

                            </Card>

                        </Col>


                        {/* ELECTION CONTROLS */}

                        <Col lg={6}>

                            <Card className="shadow h-100">

                                <Card.Body>

                                    <h5>⚙️ Election Controls</h5>

                                    {getStateName(electionState) === "NOT_STARTED" && (

                                        <Button
                                            className="mt-3 w-100"
                                            variant="primary"
                                            onClick={startElection}
                                        >
                                            Start Election
                                        </Button>

                                    )}

                                    {electionLive && (

                                        <Button
                                            className="mt-3 w-100"
                                            variant="danger"
                                            onClick={finalizeElection}
                                        >
                                            Finalize Election
                                        </Button>

                                    )}

                                    {getStateName(electionState) === "ENDED" && (

                                        <Alert variant="success" className="mt-3">
                                            This election has ended.
                                        </Alert>

                                    )}

                                    {getStateName(electionState) === "CANCELLED" && (

                                        <Alert variant="danger" className="mt-3">
                                            This election has been cancelled.
                                        </Alert>

                                    )}

                                    <Button
                                        className="mt-3 w-100"
                                        variant="outline-secondary"
                                        onClick={() => loadElectionDetails(selectedElection)}
                                    >
                                        Refresh Election Details
                                    </Button>

                                </Card.Body>

                            </Card>

                        </Col>

                    </Row>

                </>

            )}

        </Container>

    );

}

export default AdminDashboard;
