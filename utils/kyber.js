const { Contract } = require("../config/web3");
const contractData = require("../config/contracts");
const { web3 } = require("../config/web3");
const { toWei, toEth } = require("./web3");

const getRate = async (pairInfo, chainId) => {
  const kyberContract = new Contract(
    contractData.kyber.abi,
    contractData.kyber.addresses.proxy[chainId]
  );

  let tokenA, tokenB;
  if (pairInfo.wethToken == 0) {
    tokenA = pairInfo.token0;
    tokenB = pairInfo.token1;
  } else {
    tokenA = pairInfo.token1;
    tokenB = pairInfo.token0;
  }
  var rate = await kyberContract.methods
    .getExpectedRate(tokenA, tokenB, toWei("0.1"))
    .call()
    .catch(console.log);

  return toEth(rate[0]);
};

module.exports = { getRate };
