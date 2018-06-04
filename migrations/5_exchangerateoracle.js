/* global artifacts */
const ExchangeRateOracle = artifacts.require('./ExchangeRateOracle');
const FakeExchangeRateOracle = artifacts.require('./FakeExchangeRateOracle');

const CONTRACT_ADDRESSES = {
  kovan: {
    mkrPriceFeed: '0xa944bd4b25c9f186a846fd5668941aa3d3b8425f',
  },
  mainnet: {
    mkrPriceFeed: '0x729D19f657BD0614b4985Cf1D82531c67569197B',
  },
};

module.exports = (deployer, network) => {
  switch (network) {
    case 'develop':
      // use a fake instance to test locally using truffle develop
    case 'development':
      // use a fake instance to test locally using ganache
      // fall through
    case 'ropsten':
      // Maker doesn't test on ropsten so we use a fake instance
      deployer.deploy(FakeExchangeRateOracle); //, { gas: 5000000, gasPrice: 25000000000 });
      break;

    case 'kovan':
      // fall through

    case 'mainnet':
      deployer.deploy(
        ExchangeRateOracle,
        // pass int he address of the Maker price feed contract on the blockchain
        CONTRACT_ADDRESSES[network].mkrPriceFeed,
        //{ gas: 6000000, gasPrice: 25000000000 },
      );
      break;

    default:
      throw new Error(`did not specify how to deploy ExchangeRateOracle on this network (${network})`);
  }
};
