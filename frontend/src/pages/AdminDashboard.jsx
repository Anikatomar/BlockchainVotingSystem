import { useState, useEffect } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Form,
    Alert
} from "react-bootstrap";
function AdminDashboard() {

    const [file, setFile] = useState(null);
    const [message,setMessage]=useState("");

const [candidateName,setCandidateName]=useState("");

const [candidates,setCandidates]=useState([]);
const [electionLive, setElectionLive] = useState(false);
useEffect(() => {
        loadCandidates();
    }, []);

    async function uploadCSV() {

        if (!file) {
            setMessage("Please choose a CSV file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
            "http://127.0.0.1:5000/uploadVoters",
            {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();

        setMessage(
            `Imported ${data.imported} voters | Rejected ${data.rejected}`
        );
    }
    async function loadElectionStatus() {

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/summary"
        );

        const data = await response.json();

        setElectionLive(data.started);

    }

    catch(error){

        console.log(error);

    }

}
useEffect(() => {

    loadElectionStatus();

}, []);
async function addCandidate() {

    if (candidateName.trim() === "") {
        setMessage("Candidate name cannot be empty.");
        return;
    }

    const response = await fetch(
        "http://127.0.0.1:5000/addCandidate",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: candidateName
            })
        }
    );

    const data = await response.json();

    if (data.success) {

        setMessage("Candidate added successfully.");

        setCandidateName("");

        loadCandidates();

    } else {

        setMessage(data.error);

    }
}
async function loadCandidates(){

const response=await fetch(

"http://127.0.0.1:5000/getCandidates"

);

const data=await response.json();

setCandidates(data);

}
async function startElection() {

    const response = await fetch(
        "http://127.0.0.1:5000/startElection",
        {
            method: "POST"
        }
    );

    const data = await response.json();

    if (data.success) {

        alert("✅ Election started successfully!");

    }
    else {

        alert(data.error || data.message || "Failed to start election.");
        console.log(data);

    }

}
async function endElection() {

    const response = await fetch(
        "http://127.0.0.1:5000/endElection",
        {
            method: "POST"
        }
    );

    const data = await response.json();

    console.log(data);

    if (data.success) {

        alert("✅ Election ended successfully!");

    }
    else {

        alert(data.error || data.message || "Failed to end election.");

    }

}
    return (

        <Container className="py-4">

            <h2 className="mb-4 text-center">
                Election Administrator Dashboard
            </h2>

            <Row className="g-4">

                <Col md={4}>
                    <Card className="shadow h-100">
                        <Card.Body>
                            <h5>📂 Verified Voters</h5>

                            <Form.Control
                                type="file"
                                accept=".csv"
                                className="mt-3"
                                onChange={(e)=>setFile(e.target.files[0])}
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

                <Col md={4}>

<Card className="shadow h-100">

<Card.Body>

<h5>👥 Candidate Management</h5>

<Form.Control

className="mt-3"

placeholder="Candidate Name"

value={candidateName}

onChange={(e)=>setCandidateName(e.target.value)}
 disabled={electionLive}
/>
{
    electionLive &&

    <Alert
        variant="warning"
        className="mt-3"
    >
        Candidates cannot be added after the election has started.
    </Alert>
}
<Button
    onClick={addCandidate}
    disabled={electionLive}
>
    {
        electionLive
            ? "Election Started"
            : "Add Candidate"
    }
</Button>
<hr />

<h6>Current Candidates</h6>

{
    candidates.length === 0 ? (

        <p>No candidates added yet.</p>

    ) : (

        candidates.map(candidate => (

            <Card
                key={candidate.id}
                className="mb-2"
            >

                <Card.Body>

                    <strong>{candidate.name}</strong>

                    <br />

                    Votes : {candidate.votes}

                </Card.Body>

            </Card>

        ))

    )
}
</Card.Body>

</Card>

</Col>

                <Col md={4}>
                    <Card className="shadow h-100">
                        <Card.Body>

                            <h5>🗳 Election Controls</h5>

                            <Button
        className="mt-3 w-100"
    variant="primary"
    onClick={startElection}
>
                                Start Election
                            </Button>

                            <Button
                                className="mt-2 w-100"
                                variant="danger"
                                onClick={endElection}
                            >
                                End Election
                            </Button>

                        </Card.Body>
                    </Card>
                </Col>

            </Row>

            {
                message &&
                <Alert className="mt-4">
                    {message}
                </Alert>
            }

        </Container>

    );

}

export default AdminDashboard;