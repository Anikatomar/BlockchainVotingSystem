import NavigationBar from "../components/layout/Navbar";
import { FaTrophy } from "react-icons/fa";
import { useState, useEffect } from "react";
import { Card, Table } from "react-bootstrap";
function Results() {
  const [winner, setWinner] = useState(null);

const [summary, setSummary] = useState(null);

const [candidates, setCandidates] = useState([]);
async function loadResults() {

    try {

        const winnerResponse = await fetch(
            "http://127.0.0.1:5000/winner"
        );

        const summaryResponse = await fetch(
            "http://127.0.0.1:5000/summary"
        );

        const candidateResponse = await fetch(
            "http://127.0.0.1:5000/getCandidates"
        );

        setWinner(await winnerResponse.json());

        setSummary(await summaryResponse.json());

        setCandidates(await candidateResponse.json());

    }

    catch(error){

        console.log(error);

    }

}
useEffect(() => {

    loadResults();

}, []);
  return (
    <>
      <NavigationBar />

      <div className="container mt-5">

        <h1>
  <FaTrophy className="me-2" color="#ffc107" />
  Results
</h1>

        <hr />

        <Card className="shadow p-4">

    <h2>🏆 Winner</h2>

    {
    winner?.success === false ?

    <>

        <h2 className="text-warning">

            🗳 Election In Progress

        </h2>

        <p>

            Winner will be declared after the election ends.

        </p>

    </>

    :

    <>

        <h1 className="text-success">

            {winner?.name}

        </h1>

        <h5>

            Votes : {winner?.votes}

        </h5>

    </>

}

    <hr />

    <p>

        Total Votes :

        {summary?.totalVotes ?? 0}

    </p>

</Card>

        <Card className="shadow mt-4 p-4">

    <h3>Final Results</h3>

    <Table striped bordered hover className="mt-3">

        <thead>

            <tr>

                <th>Rank</th>

                <th>Candidate</th>

                <th>Votes</th>

            </tr>

        </thead>

        <tbody>

        {

            [...candidates]

            .sort((a,b)=>b.votes-a.votes)

            .map((candidate,index)=>(

                <tr key={candidate.id}>

                    <td>

                        {

                            index===0

                            ? "🥇"

                            : index===1

                            ? "🥈"

                            : index===2

                            ? "🥉"

                            : index+1

                        }

                    </td>

                    <td>{candidate.name}</td>

                    <td>{candidate.votes}</td>

                </tr>

            ))

        }

        </tbody>

    </Table>

</Card>

      </div>
    </>
  );
}

export default Results;