const ERC20 = require("@uniswap/v2-core/build/ERC20.json");
const UniswapFactory = require("@uniswap/v2-core/build/UniswapV2Factory.json");
const UniswapPair = require("@uniswap/v2-core/build/UniswapV2Pair.json");
const KyberNetworkProxy = require("../build/contracts/IKyberNetworkProxy.json");
const { WETH } = require("@uniswap/sdk");
const contract = require("../build/contracts/SwapContractV2.json");

const contractData = {
  contract: {
    address: {
      1: contract.networks[1],
      4: contract.networks[4],
      5777: contract.networks[5777],
    },
    abi: contract.abi,
  },
  uniswap: {
    addresses: {
      factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
      router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    },
    topics: {
      swap:
        "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822",
      transfer:
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      sync:
        "0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1",
    },
    abis: {
      factory: UniswapFactory.abi,
      pair: UniswapPair.abi,
    },
  },
  kyber: {
    addresses: {
      network: {
        1: "0x7C66550C9c730B6fdd4C03bc2e73c5462c5F7ACC",
        4: "0x72910183AfFe53C3f57a7D010C730C2F90AB3bFA",
        5777: "0x7C66550C9c730B6fdd4C03bc2e73c5462c5F7ACC",
      },
      proxy: {
        1: "0x9AAb3f75489902f3a48495025729a0AF77d4b11e",
        4: "0x0d5371e5EE23dec7DF251A8957279629aa79E9C5",
        5777: "0x9AAb3f75489902f3a48495025729a0AF77d4b11e",
      },
    },
    abi: KyberNetworkProxy.abi,
  },
  token: {
    WETH: {
      address: {
        1: WETH[1].address,
        4: WETH[4].address,
        5777: WETH[1].address,
      },
    },
    abi: ERC20.abi,
  },
};

module.exports = contractData;
