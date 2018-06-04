/* global artifacts */
const SmsCertifier = artifacts.require('./certifier/SmsCertifier');

module.exports = (deployer) => {
  // gas 552,780
  deployer.deploy(SmsCertifier); //, { gas: 6000000, gasPrice: 25000000000 });
};
