
import { useState } from "react";
import {
    Container,
    Card,
    Form,
    Button,
    Alert,
    Spinner
} from "react-bootstrap";

import { useNavigate } from "react-router-dom";
import { FaUserShield } from "react-icons/fa";

function Admin() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function login() {

        setError("");

        if (!username || !password) {
            setError("Please enter both username and password.");
            return;
        }

        setLoading(true);

        try {

            const response = await fetch(
                "http://127.0.0.1:5000/adminLogin",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        username,
                        password
                    })
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                navigate("/admin/dashboard");
            } else {
                setError(data.message || "Invalid Username or Password.");
            }

        } catch (err) {

            setError("Unable to connect to the server. Please try again.");

        } finally {
            setLoading(false);
        }
    }

    return (

        <Container className="mt-5">

            <Card className="shadow p-5">

                <h2 className="text-center">
                    <FaUserShield className="me-2" />
                    Administrator Login
                </h2>

                <Form.Group className="mt-4">

                    <Form.Label>Username</Form.Label>

                    <Form.Control
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                    />

                </Form.Group>

                <Form.Group className="mt-3">

                    <Form.Label>Password</Form.Label>

                    <Form.Control
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") login();
                        }}
                    />

                </Form.Group>

                <Button
                    className="mt-4"
                    onClick={login}
                    disabled={loading}
                >

                    {loading ? (
                        <>
                            <Spinner
                                size="sm"
                                animation="border"
                                className="me-2"
                            />
                            Logging in...
                        </>
                    ) : (
                        "Login"
                    )}

                </Button>

                {error && (
                    <Alert variant="danger" className="mt-3">
                        {error}
                    </Alert>
                )}

            </Card>

        </Container>
    );
}

export default Admin;
