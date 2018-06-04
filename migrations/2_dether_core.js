/* global artifacts */
const DetherCore = artifacts.require('./DetherCore');

module.exports = (deployer) => {
  // gas: 4,643,520
  deployer.deploy(DetherCore, { gas: 7000000, gasPrice: 25000000000 });
};
