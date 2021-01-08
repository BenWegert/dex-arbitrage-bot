const { Contract } = require("../config/web3");
const contractData = require("../config/contracts");
const {
  Token,
  TokenAmount,
  Pair,
  Route,
  WETH,
  Trade,
  TradeType,
} = require("@uniswap/sdk");
const { web3 } = require("../config/web3");
const { toWei } = require("./web3");

const { decimals, pairs } = require("../cache/index");

const factoryContract = new Contract(
  contractData.uniswap.abis.factory,
  contractData.uniswap.addresses.factory
);

const getPair = async (tokenA, tokenB) => {
  var pairAddress = await factoryContract.methods
    .getPair(tokenA, tokenB)
    .call()
    .catch(console.log);
  return pairAddress;
};

const parseReserves = (sync) => {
  return web3.eth.abi.decodeParameters(["uint256", "uint256"], sync.data);
};

const getPairInfo = async (pairAddress, chainId) => {
  var cachedPair = pairs.get(pairAddress);
  if (cachedPair) {
    var token0 = cachedPair.token0;
    var token1 = cachedPair.token1;
    var wethToken = cachedPair.wethToken;
  } else {
    var pairContract = new Contract(
      contractData.uniswap.abis.pair,
      pairAddress
    );

    var [token0, token1] = await Promise.all([
      pairContract.methods
        .token0()
        .call()
        .catch((err) => console.log("Failed to fetch token0", err.data)),
      pairContract.methods
        .token1()
        .call()
        .catch((err) => console.log("Failed to fetch token1", err.data)),
    ]);
    var wethToken = token0 == WETH[chainId].address ? 0 : 1;

    pairs.set(pairAddress, { token0, token1, wethToken });
  }

  if (
    token0 &&
    token1 &&
    (token0 == WETH[chainId].address || token1 == WETH[chainId].address)
  ) {
    var cachedDecimals0 = decimals.get(token0);
    var cachedDecimals1 = decimals.get(token1);

    if (cachedDecimals0) {
      var decimals0 = cachedDecimals0;
    } else {
      var token0Contract = new Contract(contractData.token.abi, token0);

      var decimals0 = await token0Contract.methods
        .decimals()
        .call()
        .catch((err) =>
          console.log("Failed to fetch token0 decimals", err.data)
        );

      decimals.set(token0, decimals0);
    }

    if (cachedDecimals1) {
      var decimals1 = cachedDecimals1;
    } else {
      var token1Contract = new Contract(contractData.token.abi, token1);

      var decimals1 = await token1Contract.methods
        .decimals()
        .call()
        .catch((err) =>
          console.log("Failed to fetch token0 decimals", err.data)
        );

      decimals.set(token1, decimals1);
    }

    return {
      token0,
      token1,
      decimals0: parseInt(decimals0),
      decimals1: parseInt(decimals1),
      wethToken,
    };
  } else return null;
};

const getTrade = (pairInfo, reserves, chainId) => {
  const TOKENS = [
    new Token(chainId, pairInfo.token0, pairInfo.decimals0),
    new Token(chainId, pairInfo.token1, pairInfo.decimals1),
  ];

  const PAIR = new Pair(
    new TokenAmount(TOKENS[0], reserves[0]),
    new TokenAmount(TOKENS[1], reserves[1])
  );

  var route = new Route([PAIR], TOKENS[pairInfo.wethToken]);

  const TRADE = new Trade(
    route,
    new TokenAmount(TOKENS[pairInfo.wethToken], toWei("0.1")), //0.1 ETH
    TradeType.EXACT_INPUT
  );

  return TRADE.executionPrice.toSignificant(6);
};

module.exports = {
  getPair,
  parseReserves,
  getPairInfo,
  getTrade,
};
