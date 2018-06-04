/* global artifacts */
const KycCertifier = artifacts.require('./certifier/KycCertifier');

module.exports = (deployer) => {
  // gas 552,780
  deployer.deploy(KycCertifier); //, { gas: 6000000, gasPrice: 25000000000 });
};
