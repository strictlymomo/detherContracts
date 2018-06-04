/* global artifacts */
const DetherZoning = artifacts.require('./map/DetherZoning');

module.exports = (deployer) => {
  deployer.deploy(DetherZoning); //, { gas: 6000000, gasPrice: 25000000000 });
};
