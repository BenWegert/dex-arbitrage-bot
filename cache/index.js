const NodeCache = require("node-cache");

module.exports = {
  decimals: new NodeCache({
    stdTTL: 300,
    checkperiod: 30,
  }),
  pairs: new NodeCache({
    stdTTL: 300,
    checkperiod: 30,
  }),
  blocks: new NodeCache({
    stdTTL: 90,
    checkperiod: 3,
  }),
  syncs: new NodeCache({
    stdTTL: 2,
    checkperiod: 1,
  }),
  trades: new NodeCache({
    stdTTL: 60,
    checkperiod: 1,
  }),
};
