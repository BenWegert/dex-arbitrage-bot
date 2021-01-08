const SwapContractV2 = artifacts.require("SwapContractV2");
const contractData = require("../config/contracts");

module.exports = async function (deployer, network, accounts) {
  let chainId;
  switch (network) {
    case "main":
      chainId = 1;
      break;
    case "rinkeby":
      chainId = 4;
      break;
    case "development":
      chainId = 5777;
      break;
    default:
      throw "invalid network";
  }
  console.log(chainId);
  await deployer.deploy(
    SwapContractV2,
    contractData.uniswap.addresses.factory,
    contractData.token.WETH.address[chainId],
    contractData.kyber.addresses.network[chainId]
  );
};
