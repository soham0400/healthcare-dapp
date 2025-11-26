const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load ABI
const contractJson = require("../contract/HospitalRegistry.json");

let provider, contract;

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const initializeBlockchain = async () => {
    const maxRetries = 10;
    const retryDelay = 3000; // 3 seconds

    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`🔗 Attempting to connect to blockchain (attempt ${i + 1}/${maxRetries})...`);

            // Create provider with explicit network configuration
            provider = new ethers.JsonRpcProvider(
                process.env.PROVIDER_URL,
                {
                    chainId: 1337, // ✔️ match Ganache
                    name: "ganache"
                }
            );

            // Test connection by getting network
            await provider.getNetwork();

            const contractAddress = process.env.CONTRACT_ADDRESS;
            contract = new ethers.Contract(
                contractAddress,
                contractJson.abi,
                provider
            );

            // Verify contract is accessible
            await contract.owner();

            console.log("✅ Blockchain connected & contract loaded");
            console.log("Provider URL:", process.env.PROVIDER_URL);
            console.log("Contract address:", contractAddress);
            return;
        } catch (err) {
            console.log(`⚠️ Connection attempt ${i + 1} failed: ${err.message}`);
            if (i < maxRetries - 1) {
                console.log(`⏳ Retrying in ${retryDelay/1000} seconds...`);
                await wait(retryDelay);
            } else {
                console.error("❌ Failed to connect to blockchain after all retries");
                throw err;
            }
        }
    }
};

module.exports = {
    initializeBlockchain,
    getProvider: () => provider,
    getContract: () => contract,
};