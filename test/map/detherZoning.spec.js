/* eslint-env node, mocha */
/* global artifacts, contract, web3, assert */
/* eslint-disable max-len */

const path = require('path');
const fs = require('fs');
const { expectThrow, addCountryFileToZoning } = require('../utils');
const DetherZoning = artifacts.require('DetherZoning.sol');

const getAccounts = () => new Promise((resolve, reject) => {
  web3.eth.getAccounts((err, acc) => err ? reject(err) : resolve(acc)); // eslint-disable-line
});

let owner;
let user1;
let user2;
let user3;

let congocode;

let zoningContract;

contract('DetherZoning', () => {

  before(async () => {
    const accs = await getAccounts();
    owner = accs[0];
    user1 = accs[1];
    user2 = accs[2];
    user3 = accs[3];

    congocode = web3.fromAscii('CG'); // 0x4347
  });

  beforeEach(async () => {
    zoningContract = await DetherZoning.new();

    await addCountryFileToZoning(owner, web3, zoningContract, 'CG', 20);
  });

  describe('isInsideCountry(uint x18, uint y18, bytes2 country)', () => {
    it('[success] x18 + y18 are not within country', async () => {
      assert.equal(
        await zoningContract.isInsideCountry(144704, 128749, congocode),
        false,
        'should be outside',
      );

      assert.equal(
        await zoningContract.isInsideCountry(141567, 130475, congocode),
        false,
        'should be outside',
      );

      assert.equal(
        await zoningContract.isInsideCountry(143488, 131904, congocode),
        false,
        'should be outside',
      );
    });

    it('[success] x18 + y18 are within country', async () => {
      assert.equal(
        await zoningContract.isInsideCountry(142915, 131698, congocode),
        true,
        'should be inside',
      );

      assert.equal(
        await zoningContract.isInsideCountry(144703, 128748, congocode),
        true,
        'should be inside',
      );

      assert.equal(
        await zoningContract.isInsideCountry(141568, 130472, congocode),
        true,
        'should be inside',
      );

      assert.equal(
        await zoningContract.isInsideCountry(141568, 130475, congocode),
        true,
        'should be inside',
      );

      assert.equal(
        await zoningContract.isInsideCountry(143487, 131903, congocode),
        true,
        'should be inside',
      );

      assert.equal(
        await zoningContract.isInsideCountry(143488, 131903, congocode),
        true,
        'should be inside',
      );

      assert.equal(
        await zoningContract.isInsideCountry(143487, 131904, congocode),
        true,
        'should be inside',
      );

      assert.equal(
        await zoningContract.isInsideCountry(142093, 133366, congocode),
        true,
        'should be inside',
      );
    });
  });

  describe('getZoneCount()', () => {
    it('[success] returns zero if no zones', async () => {
      assert.equal(
        await zoningContract.getZoneCount(),
        0,
        'should be 0',
      );
    });
    it('[success] returns correct zone count if there are zones', async () => {
      await zoningContract.createZone(143488, 131903, congocode, {from: owner});

      assert.equal(
        await zoningContract.getZoneCount(),
        1,
        'should equal 1',
      );
    });
  });

  describe('doesZoneExist(uint x18, uint y18)', () => {
    it('[success] zone exists after added', async () => {
      const x = 143488;
      const y = 131903;

      assert.equal(
        await zoningContract.doesZoneExist(x, y),
        false,
        'should not exist',
      );

      await zoningContract.createZone(x, y, congocode, {from: owner});

      assert.equal(
        await zoningContract.doesZoneExist(x, y),
        true,
        'should exist',
      );

      assert.equal(
        await zoningContract.doesZoneExist(x, y - 1),
        false,
        'should not exist',
      );
    });
  });

  describe('createZone(uint x18, uint y18, bytes2 country)', () => {
    it('[error] should throw if x18 to big', async () => {
      await expectThrow(zoningContract.createZone(324000, 102799, congocode, {from: owner}));
    });
    it('[error] should throw if y18 to big', async () => {
      await expectThrow(zoningContract.createZone(126000, 345999, congocode, {from: owner}));
    });
    it('[success] should add zone', async () => {
      const x = 143488;
      const y = 131903;

      assert.equal(
        await zoningContract.doesZoneExist(x, y),
        false,
        'should not exist',
      );

      await zoningContract.createZone(x, y, congocode);

      assert.equal(
        await zoningContract.doesZoneExist(x, y),
        true,
        'should exist',
      );
    });
    it('[error] calling create zone twice for same zone throws', async () => {
      const x = 143488;
      const y = 131903;
      await zoningContract.createZone(x, y, congocode, {from: owner});
      await expectThrow(zoningContract.createZone(x, y, congocode ,{from: owner}))
    });
  });

  // it('Claim zone', async () => {
  //   for (var key in congo) {
  //     var value = congo[key];
  //     await zoningContract.updateCountry(congocode, key, value);
  //   }
  //
  //   // Distribution of loyalty points
  //   await zoningContract.simulateLoyaltyPoints(user1, 586, {from: owner});
  //   await zoningContract.simulateLoyaltyPoints(user2, 200, {from: owner});
  //   await zoningContract.simulateLoyaltyPoints(user3, 700, {from: owner});
  //
  //   assert.equal(
  //     await zoningContract.loyaltyPoints(user1),
  //     586,
  //     'user1 has loyalty points',
  //   );
  //
  //   assert.equal(
  //     await zoningContract.loyaltyPoints(user2),
  //     200,
  //     'user2 has loyalty points',
  //   );
  //
  //   assert.equal(
  //     await zoningContract.loyaltyPoints(user3),
  //     700,
  //     'user3 has loyalty points',
  //   );
  //
  //   const x = 143488;
  //   const y = 131903;
  //   zoneId = '143488-131903'
  //
  //   await zoningContract.createZone(x, y, congocode, {from: user1});
  //
  //   assert.equal(
  //     await zoningContract.getZoneOwner(zoneId),
  //     user1,
  //     'user1 is the zoneOwner',
  //   );
  //
  //   await expectThrow(zoningContract.claimZone(zoneId,  {from: user2}));
  //
  //   assert.equal(
  //     await zoningContract.claimZone(zoneId,  {from: user3}),
  //     true,
  //     'user3 should have enough loyalty points',
  //   );
  //
  //   await zoningContract.claimZone(zoneId,  {from: user3});
  //
  //   assert.equal(
  //     await zoningContract.getZoneOwner(zoneId),
  //     user3,
  //     'user3 should be the zoneOwner',
  //   );
  //
  //   // Non-existence
  //   await expectThrow(zoningContract.claimZone('8765-12876',  {from: user2}));
  // });
});
