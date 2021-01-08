const { web3 } = require("../config/web3");

const toWei = (n) => {
  return web3.utils.toWei(n, "ether");
};

const toEth = (n) => {
  return web3.utils.fromWei(n, "ether");
};

const toBN = (string) => {
  return web3.utils.toBN(string);
};

module.exports = {
  toWei,
  toEth,
};
