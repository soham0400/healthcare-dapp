module.exports = {
  networks: {
    development: {
      host: "ganache",
      port: 8545,
      network_id: "1337",  // match Ganache default
      chainId: 1337,       // important
      gas: 6721975,
      gasPrice: 20000000000
    }
  },
  compilers: {
    solc: {
      version: "0.8.17"
    }
  }
};
