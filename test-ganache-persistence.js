const { Web3 } = require("web3");

// Ganache RPC
const web3 = new Web3("http://localhost:8545");

(async () => {
  console.log("⛓  Checking blockchain status...\n");

  const blockBefore = await web3.eth.getBlockNumber();
  console.log(`📌 Current Block Number (before tx): ${blockBefore}\n`);

  const accounts = await web3.eth.getAccounts();
  console.log("👤 Accounts:");
  console.log(accounts);

  const balances = await Promise.all(
    accounts.map(acc => web3.eth.getBalance(acc))
  );

  console.log("\n💰 Balances:");
  balances.forEach((bal, i) => {
    console.log(`${accounts[i]} => ${web3.utils.fromWei(bal, "ether")} ETH`);
  });

  console.log("\n🚀 Sending 1 ETH from account[0] → account[1]...\n");

  const tx = await web3.eth.sendTransaction({
    from: accounts[0],
    to: accounts[1],
    value: web3.utils.toWei("1", "ether"),
    gas: 21000,
    gasPrice: web3.utils.toWei("20", "gwei")  // 👈 avoids EIP-1559
  });

  console.log("🟢 Transaction mined!");
  console.log(`🔗 Tx Hash: ${tx.transactionHash}`);
  console.log(`📦 Block: ${tx.blockNumber}\n`);

  const blockAfter = await web3.eth.getBlockNumber();
  console.log(`📌 Current Block Number (after tx): ${blockAfter}`);

  console.log(`\n🔍 Block difference: ${blockAfter - blockBefore}`);

  console.log("\n🎉 Script complete!");
})();
