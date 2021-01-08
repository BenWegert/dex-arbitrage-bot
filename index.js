require("dotenv").config();

let chainId;
const { web3, Contract } = require("./config/web3");
const { syncs, blocks } = require("./cache/index");
const { blacklist } = require("./config/preferences");
const contractData = require("./config/contracts");
const uniswapUtils = require("./utils/uniswap");
const kyberUtils = require("./utils/kyber");

syncs.on("expired", async (address, sync) => {
  if (blocks.get("timestamp")) {
    parseSync(address, sync);
  }
});

const main = async () => {
  chainId = await web3.eth.getChainId();

  web3.eth
    .subscribe("logs", {
      topics: [contractData.uniswap.topics.sync],
    })
    .on("connected", async () => {
      console.log(
        "[INFO]: Connected to Ethereum: Listening for syncs on CHAIN ID: " +
          chainId
      );
    })
    .on("data", async (sync) => {
      syncs.set(sync.address, sync);
    })
    .on("error", async (error) => {
      console.log("[ERROR]: " + error);
    });

  web3.eth
    .subscribe("newBlockHeaders")
    .on("connected", async () => {
      console.log(
        "[INFO]: Connected to Ethereum: Listening for new blocks on CHAIN ID: " +
          chainId
      );
    })
    .on("data", async (block) => {
      blocks.set("gasPrice", await web3.eth.getGasPrice());
      blocks.set("timestamp", block.timestamp);
      console.log(
        `[INFO]: Received block ${block.number} with gasCost: ${blocks.get(
          "gasPrice"
        )}`
      );
    })
    .on("error", async (error) => {
      console.log("[ERROR]: " + error);
    });
};

const parseSync = async (address, sync) => {
  var reserves = uniswapUtils.parseReserves(sync);
  var pairInfo = await uniswapUtils.getPairInfo(address, chainId);

  if (pairInfo) {
    var uniswapRate = uniswapUtils.getTrade(pairInfo, reserves, chainId);
    var kyberRate = await kyberUtils.getRate(pairInfo, chainId);
    var arbitrage = ((uniswapRate - parseFloat(kyberRate)) / uniswapRate) * 100;
    if (kyberRate != 0 && Math.abs(arbitrage) > 2) {
      if (pairInfo.wethToken == 1) console.log(pairInfo.token0);
      else console.log(pairInfo.token1);
      console.log(uniswapRate, kyberRate, arbitrage.toFixed(2));
    }
  }
};

main();
