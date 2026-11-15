
const hre = require("hardhat");

async function main() {
    const signers = await hre.ethers.getSigners();

    console.log("Number of accounts found:", signers.length);

    signers.forEach((signer, index) => {
        console.log(`Account ${index}:`, signer.address);
    });

    if (signers.length < 4) {
        throw new Error(
            "Ganache must provide at least 4 accounts: 1 admin and 3 officials."
        );
    }

    const [admin, official1, official2, official3] = signers;

    const officialAddresses = [
        await official1.getAddress(),
        await official2.getAddress(),
        await official3.getAddress()
    ];

    console.log("\nAdmin:", await admin.getAddress());
    console.log("Officials:", officialAddresses);

    const Voting = await hre.ethers.getContractFactory("Voting");

    const voting = await Voting.deploy(officialAddresses);

    console.log("\nDeploying Voting Contract...");

    await voting.waitForDeployment();

    console.log("Contract deployed successfully!");
    console.log("Contract Address:", await voting.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
