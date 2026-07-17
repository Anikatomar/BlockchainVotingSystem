const hre = require("hardhat");

async function main() {

    // Create a contract factory from Voting.sol
    const Voting = await hre.ethers.getContractFactory("Voting");

    console.log("Deploying Voting Contract...");

    // Deploy the contract
    const voting = await Voting.deploy("IEEE Student Council Election");

    // Wait until deployment is complete
    await voting.waitForDeployment();

    // Print the deployed contract address
    console.log("Contract deployed successfully!");
    console.log("Contract Address:", await voting.getAddress());

}

// Execute the deployment
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});