
import NavigationBar from "../components/layout/Navbar";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

import {
  FaLock,
  FaNetworkWired,
  FaHistory,
  FaBolt,
  FaLink,
  FaListAlt
} from "react-icons/fa";

function Home() {
  return (
    <>
      <NavigationBar />

      <Container className="py-5">

        <Row className="text-center mb-5">
          <Col>
            <h1 className="display-3 fw-bold text-primary">
              Blockchain Voting System
            </h1>

            <div className="my-3">
              <FaLink size={65} color="#0d6efd" />
            </div>

            <h5 className="text-muted mb-4">
              Powered by Ethereum Blockchain
            </h5>

            <p className="lead">
              Secure • Transparent • Tamper-Proof • Decentralized
            </p>
          </Col>
        </Row>

        <Row className="g-4">

          {/* Admin Portal */}
          <Col lg={4} md={6}>
            <Card className="portal-card h-100 text-center">
              <Card.Body>
                <div className="portal-icon">👨‍💼</div>
                <h3>Admin Portal</h3>
                <p>
                  Manage candidates, create elections and monitor voting.
                </p>
                <Button as={Link} to="/admin" variant="primary">
                  Enter Portal
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Browse Elections */}
          <Col lg={4} md={6}>
            <Card className="portal-card h-100 text-center">
              <Card.Body>
                <div className="portal-icon">
                  <FaListAlt size={40} color="#0d6efd" />
                </div>
                <h3>Browse Elections</h3>
                <p>
                  Explore all available elections and choose the one
                  you want to participate in.
                </p>
                <Button as={Link} to="/elections" variant="info">
                  View Elections
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Cast Vote */}
          <Col lg={4} md={6}>
            <Card className="portal-card h-100 text-center">
              <Card.Body>
                <div className="portal-icon">🗳️</div>
                <h3>Cast Vote</h3>
                <p>
                  Vote securely through blockchain technology.
                </p>
                <Button as={Link} to="/vote" variant="success">
                  Vote Now
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Live Dashboard */}
          <Col lg={4} md={6}>
            <Card className="portal-card h-100 text-center">
              <Card.Body>
                <div className="portal-icon">📊</div>
                <h3>Live Dashboard</h3>
                <p>
                  Watch live election statistics and charts.
                </p>
                <Button as={Link} to="/dashboard" variant="warning">
                  Open Dashboard
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Results */}
          <Col lg={4} md={6}>
            <Card className="portal-card h-100 text-center">
              <Card.Body>
                <div className="portal-icon">🏆</div>
                <h3>Results</h3>
                <p>
                  View election winners and vote distribution.
                </p>
                <Button as={Link} to="/results" variant="dark">
                  View Results
                </Button>
              </Card.Body>
            </Card>
          </Col>

        </Row>

        {/* Why Blockchain Voting */}
        <Row className="mt-5">
          <Col>
            <Card className="shadow-lg border-0">
              <Card.Body className="p-5">

                <h2 className="mb-4">
                  Why Blockchain Voting?
                </h2>

                <Row>
                  <Col md={6}>
                    <h5>
                      <FaLock className="me-2 text-primary" />
                      Secure
                    </h5>
                    <p>
                      Votes are protected using blockchain technology.
                    </p>

                    <h5>
                      <FaNetworkWired className="me-2 text-success" />
                      Decentralized
                    </h5>
                    <p>
                      No single authority can manipulate election data.
                    </p>
                  </Col>

                  <Col md={6}>
                    <h5>
                      <FaHistory className="me-2 text-warning" />
                      Immutable
                    </h5>
                    <p>
                      Every vote becomes a permanent blockchain record.
                    </p>

                    <h5>
                      <FaBolt className="me-2 text-danger" />
                      Live Monitoring
                    </h5>
                    <p>
                      Track election progress in real time.
                    </p>
                  </Col>
                </Row>

              </Card.Body>
            </Card>
          </Col>
        </Row>

      </Container>
    </>
  );
}

export default Home;
