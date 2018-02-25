var DetherInterface = artifacts.require("./DetherInterface.sol");
var DetherStorage = artifacts.require("./DetherTellerStorage.sol");
var SmsCertifier = artifacts.require("./certifier/SmsCertifier.sol");
var DetherToken = artifacts.require("./dth/DetherToken.sol")
var DthRegistry = artifacts.require("./DthRegistry.sol")

module.exports = function(deployer, network) {

  deployer.deploy(DetherStorage, {gas: 4500000})
  .then(() => deployer.deploy(SmsCertifier, {gas: 4500000}))
  .then(() => deployer.deploy(DetherToken, {gas: 4500000}))
  .then(() => deployer.deploy(DthRegistry, {gas: 4500000}))
  .then(() => deployer.deploy(DetherInterface, DetherStorage.address, SmsCertifier.address, DthRegistry.address, {gas: 4500000}))


};
