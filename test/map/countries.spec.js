/* eslint-env node, mocha */
/* global artifacts, contract, web3, assert */
/* eslint-disable max-len */

const path = require('path');
const fs = require('fs');
const { addCountryFileToZoning } = require('../utils');
const DetherZoning = artifacts.require('DetherZoning.sol');

const getAccounts = () => new Promise((resolve, reject) => {
  web3.eth.getAccounts((err, acc) => err ? reject(err) : resolve(acc)); // eslint-disable-line
});

let owner;
let user1;
let user2;
let user3;

let zoningContract;

contract('Countries', () => {
  before(async () => {
    const accs = await getAccounts();
    owner = accs[0];
    user1 = accs[1];
    user2 = accs[2];
    user3 = accs[3];
  });

  beforeEach(async () => {
    zoningContract = await DetherZoning.new();
  });

  describe('updateCountry(bytes2 country, uint xIndex_, uint[] value)', () => {
    it('[success] can add single X zone', async () => {
      const x = 123;
      const y = [7, 13, 6, 16];
      const countryCode = web3.fromAscii('CG');
      await zoningContract.updateCountry(countryCode, x, y);
      const columns = await zoningContract.getCountryColumn(x, countryCode);
      expect(columns).to.be.an('array').with.lengthOf(y.length);
      for (let j = 0; j < y.length; j++) {
        expect(columns[j].eq(y[j])).to.equal(true);
      }
    });
  });

  const numStringAddCommas = str => (
    str.split('').reverse().map((x, idx, arr) => {
      if ((idx + 1) % 3 === 0 && idx !== (arr.length - 1)) {
        return `,${x}`
      } else {
        return x;
      }
    }).reverse().join('')
  );

  describe.only('updateCountryBatch(bytes2 country, uint xIndex_, bytes value)', () => {
    const countryCodes = fs
      .readdirSync(path.join(__dirname, '../../zones'))
      .filter(x => !['.', '..'].includes(x))
      .map(x => path.basename(x, '.json'));

    let balanceBirth;
    let balanceEnd;
    let logOut = {}
    before(async () => {
      balanceBirth = web3.fromWei(await web3.eth.getBalance(owner));
    });
    after(async () => {
      balanceEnd = web3.fromWei(await web3.eth.getBalance(owner));

      fs.writeFileSync(path.join(__dirname, 'zoneUploadResults.json'), JSON.stringify(logOut, null, 4));
      console.log(`adding all countries cost: ${balanceBirth.sub(balanceEnd).toString()} ETH`);
    });
    countryCodes.forEach((countryCode) => {
      it(`[success] can add country (${countryCode}) file (batch size = 20)`, async () => {
        let {
          ethCost,
          gasCost,
          batchCount,
          xData,
          yData,
        } = await addCountryFileToZoning(owner, web3, zoningContract, countryCode, 20);
        logOut = {
          ...logOut,
          [countryCode]: { batchCount, gasCost: numStringAddCommas(gasCost), ethCost },
        };
        console.log(`added country ${countryCode} in ${batchCount} batches, cost: ${numStringAddCommas(gasCost)} gas | ${ethCost} ETH`);
        for (let i = 0; i < xData.length; i++) {
          const columns = await zoningContract.getCountryColumn(xData[i], web3.fromAscii(countryCode));
          const expected_columns = yData[i];
          expect(columns).to.be.an('array').with.lengthOf(expected_columns.length);
          for (let j = 0; j < expected_columns.length; j++) {
            expect(columns[j].eq(expected_columns[j])).to.equal(true);
          }
        }
      });
    });
  });
});
