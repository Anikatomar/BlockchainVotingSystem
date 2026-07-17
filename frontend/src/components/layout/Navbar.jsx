import { Navbar, Container, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
function NavigationBar() {
  const [electionLive, setElectionLive] = useState(false);
  async function loadElectionStatus() {

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/summary"
        );

        const data = await response.json();

        setElectionLive(data.started);

    }

    catch (error) {

        console.log(error);

    }

}
useEffect(() => {

    loadElectionStatus();

    const interval = setInterval(loadElectionStatus, 5000);

    return () => clearInterval(interval);

}, []);
  return (
    <Navbar
      bg="dark"
      variant="dark"
      expand="lg"
      sticky="top"
      className="shadow-sm"
    >
      <Container>

        <Navbar.Brand
          as={Link}
          to="/"
          className="fw-bold"
        >
          🗳 Blockchain Voting System
        </Navbar.Brand>

        <div className="d-flex align-items-center">

          <span className="text-light me-2">
            Election Status
          </span>

          <Badge
    bg={
        electionLive
            ? "success"
            : "danger"
    }
>

    {

        electionLive
            ? "LIVE"
            : "CLOSED"

    }

</Badge>

        </div>

      </Container>
    </Navbar>
  );
}

export default NavigationBar;