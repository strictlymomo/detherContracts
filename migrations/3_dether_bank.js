/* global artifacts */
const DetherBank = artifacts.require('./DetherBank');

module.exports = (deployer) => {
  // gas 1,477,280
  deployer.deploy(DetherBank, { gas: 7000000, gasPrice: 5000000000 });
};
