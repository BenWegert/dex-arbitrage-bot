const { program } = require("commander");
var Web3 = require("web3");

program.version("2.0.1");
program.option(
  "-s, --source <type>",
  "add the specified source",
  "infura-rinkeby"
);
program.parse(process.argv);

const rpcConnections = {
  "infura-main": process.env.MAIN_INFURA,
  "infura-rinkeby": process.env.RINKEBY_INFURA,
  main: process.env.MAIN_RPC,
  test: process.env.TEST_RPC,
};

const rpc = rpcConnections[program.source];

var web3 = new Web3(new Web3.providers.WebsocketProvider(rpc));
const Contract = web3.eth.Contract;
const { address: admin } = web3.eth.accounts.wallet.add(
  process.env.PRIVATE_KEY
);

module.exports = {
  web3,
  Contract,
  admin,
};
