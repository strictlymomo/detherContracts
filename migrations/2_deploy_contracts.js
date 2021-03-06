/* global artifacts */
const DetherCore = artifacts.require('./DetherCore.sol');
const DetherToken = artifacts.require('./dth/DetherToken.sol');
const SmsCertifier = artifacts.require('./certifier/SmsCertifier.sol');
const KycCertifier = artifacts.require('./certifier/KycCertifier.sol');
const DetherBank = artifacts.require('./DetherBank.sol');
const ExchangeRateOracle = artifacts.require('./ExchangeRateOracle.sol');
const FakeExchangeRateOracle = artifacts.require('./FakeExchangeRateOracle.sol');

const CONTRACT_ADDRESSES = {
  kovan: {
    mkrPriceFeed: '0xa944bd4b25c9f186a846fd5668941aa3d3b8425f',
  },
  mainnet: {
    mkrPriceFeed: '0x729D19f657BD0614b4985Cf1D82531c67569197B',
  },
};

module.exports = async (deployer, network) => {
  // Migrations: gas 41915

  // gas: 4,643,520
  await deployer.deploy(DetherCore, { gas: 6000000, gasPrice: 25000000000 });

  // gas 1,161,360
  // await deployer.deploy(DetherToken, { gas: 5000000, gasPrice: 25000000000 });

  // gas 1,477,280
  await deployer.deploy(DetherBank, { gas: 6000000, gasPrice: 25000000000 });

  // gas 552,780
  await deployer.deploy(SmsCertifier, { gas: 6000000, gasPrice: 25000000000 });

  // gas 552,780
  await deployer.deploy(KycCertifier, { gas: 6000000, gasPrice: 25000000000 });

  switch (network) {
    case 'develop':
      // use a fake instance to test locally using truffle develop
    case 'development':
      // use a fake instance to test locally using ganache
      // fall through
    case 'ropsten':
      // Maker doesn't test on ropsten so we use a fake instance
      await deployer.deploy(FakeExchangeRateOracle, { gas: 5000000, gasPrice: 25000000000 });
      break;

    case 'kovan':
      // fall through

    case 'mainnet':
      await deployer.deploy(
        ExchangeRateOracle,
        // pass int he address of the Maker price feed contract on the blockchain
        CONTRACT_ADDRESSES[network].mkrPriceFeed,
        { gas: 5000000, gasPrice: 25000000000 },
      );
      break;

    default:
      throw new Error(`did not specify how to deploy ExchangeRateOracle on this network (${network})`);
  }
};
