const fs = require("fs");
const path = require("path");

// Load truffle build artifact
const artifact = JSON.parse(
  fs.readFileSync("/app/build/contracts/HospitalRegistry.json")
);

const networkId = Object.keys(artifact.networks)[0]; // dynamic
const address = artifact.networks[networkId].address;
const abi = artifact.abi;

// -----------------------
// Helper: Update or add key in .env
// -----------------------
function updateEnvFile(filePath, key, value) {
  let env = "";

  if (fs.existsSync(filePath)) {
    env = fs.readFileSync(filePath, "utf8");
  }

  const lines = env.split("\n");
  let found = false;

  const newLines = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!found) {
    newLines.push(`${key}=${value}`);
  }

  fs.writeFileSync(filePath, newLines.join("\n") + "\n", "utf8");
}

// -----------------------
// 1. Copy ABI to backend
// -----------------------
const backendContractPath = "/app/healthcare-backend/contract";
if (!fs.existsSync(backendContractPath)) {
  fs.mkdirSync(backendContractPath, { recursive: true });
}

fs.writeFileSync(
  path.join(backendContractPath, "HospitalRegistry.json"),
  JSON.stringify({ address, abi }, null, 2)
);

// -----------------------
// 2. Update backend .env
// -----------------------
updateEnvFile(
  "/app/healthcare-backend/.env",
  "CONTRACT_ADDRESS",
  address
);

// -----------------------
// 3. Update frontend .env
// -----------------------
updateEnvFile(
  "/app/healthcare-frontend/.env",
  "VITE_CONTRACT_ADDRESS",
  address
);

console.log("✅ ABI + Contract Address updated successfully!");
console.log(`📝 Contract Address: ${address}`);