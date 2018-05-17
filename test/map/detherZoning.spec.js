/* eslint-env node, mocha */
/* global artifacts, contract, web3, assert */
/* eslint-disable max-len */

const {expectThrow} = require('../utils');
const congo = require('./congo12.json');
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
let zoningContractAddress;
let DetherZoningContract;

contract('DetherZoning', () => {

  before(async () => {

    const accs = await getAccounts();
    owner = accs[0];
    user1 = accs[1];
    user2 = accs[2];
    user3 = accs[3];

    congocode = web3.fromAscii("CG"); // 0x4347
  });

  beforeEach(async () => {
    zoningContract = await DetherZoning.new();
  });

  it("Is inside country", async () => {

    for (var key in congo) {
      var value = congo[key];
      await zoningContract.updateCountry(congocode, key, value);
    }

    assert.equal(
      await zoningContract.isInsideCountry.call(144704, 128749, congocode),
      false,
      'should be outside',
    );


    assert.equal(
      await zoningContract.isInsideCountry.call(142915, 131698, congocode),
      true,
      'should be inside',
    );


    assert.equal(
      await zoningContract.isInsideCountry.call(144703, 128748, congocode),
      true,
      'should be inside',
    );


    assert.equal(
      await zoningContract.isInsideCountry.call(141568, 130472, congocode),
      true,
      'should be inside',
    );


    assert.equal(
      await zoningContract.isInsideCountry.call(141567, 130475, congocode),
      false,
      'should be outside',
    );

    assert.equal(
      await zoningContract.isInsideCountry.call(141568, 130475, congocode),
      true,
      'should be inside',
    );


    assert.equal(
      await zoningContract.isInsideCountry.call(143488, 131904, congocode),
      false,
      'should be outside',
    );

    assert.equal(
      await zoningContract.isInsideCountry.call(143487, 131903, congocode),
      true,
      'should be inside',
    );

    assert.equal(
      await zoningContract.isInsideCountry.call(143488, 131903, congocode),
      true,
      'should be inside',
    );

    assert.equal(
      await zoningContract.isInsideCountry.call(143487, 131904, congocode),
      true,
      'should be inside',
    );

    assert.equal(
      await zoningContract.isInsideCountry.call(142093, 133366, congocode),
      true,
      'should be inside',
    );

  });


  it("Test index mappings", async () => {

    // Test x non-existant
    assert.equal(
      await zoningContract.xIndex(127183),
      false,
      'should not exist while no user create zone',
    );

    // Test y non-existant y zone
    assert.equal(
      await zoningContract.yIndex(102799),
      false,
      'should not exist while no user create zone',
    );

    await zoningContract.updateXindex(127183);


    assert.equal(
      await zoningContract.xIndex(127183),
      true,
      'should not exist while no user create zone',
    );

    await zoningContract.updateYindex(102799);

    assert.equal(
      await zoningContract.yIndex(102799),
      true,
      'should not exist while no user create zone',
    );

  });

  it("Identifier functions", async () => {

    assert.equal(
      await zoningContract.zoneIdentifierFromTileCoordinates.call(127183, 102799),
      "127183-102799",
      'Zone identifier well built',
    );

    bigNumbers = await zoningContract.TileCoordinatesFromZoneIdentifier.call("127183-102799");
    x = bigNumbers[0].toNumber();
    y = bigNumbers[1].toNumber();

    assert.equal(
      x,
      127183,
      'x is is supposed to be the same after conversion',
    );

    assert.equal(
      y,
      102799,
      'y is supposed to be the same after conversion',
    );
  });


  it("Test zone Array length", async () => {

    // Test x non-existant
    assert.equal(
      await zoningContract.getZoneArrayLength.call(),
      0,
      'should be empty',
    );

  });


  it("Register zone with bad values", async () => {

    congocode = web3.fromAscii("CG"); // 0x4347
    await expectThrow(zoningContract.createZone(324000, 102799, congocode, {from: user1}));
    await expectThrow(zoningContract.createZone(126000, 345999, congocode, {from: user1}));

  });

  it("Create zone", async () => {

    for (var key in congo) {
      var value = congo[key];
      await zoningContract.updateCountry(congocode, key, value);
    }

    const x = 143488;
    const y = 131903;

    // Test x non-existant
    assert.equal(
      await zoningContract.xIndex(x),
      false,
      'should not exist while no user create zone',
    );

    // Test y non-existant y zone
    assert.equal(
      await zoningContract.yIndex(y),
      false,
      'should not exist while no user create zone',
    );

    it("Zone already exists", async () => {

      await zoningContract.createZone(143488, 131903, congocode, {from: user1});
      await expectThrow(zoningContract.createZone(143488, 131903, {from: user1}));
    });


    await zoningContract.createZone(x, y, congocode);

    assert.equal(
      await zoningContract.xIndex(x),
      true,
      'should exist ',
    );

    // Test y non-existant y zone
    assert.equal(
      await zoningContract.yIndex(y),
      true,
      'should exist',
    );

    // Try to add zone outside of specified country (but next to)
    await expectThrow(zoningContract.createZone(143104, 132500, congocode));

  });

  it("Claim zone", async () => {

    for (var key in congo) {
      var value = congo[key];
      await zoningContract.updateCountry(congocode, key, value);
    }

    // Distribution of loyalty points
    await zoningContract.simulateLoyaltyPoints(user1, 586, {from: owner});
    await zoningContract.simulateLoyaltyPoints(user2, 200, {from: owner});
    await zoningContract.simulateLoyaltyPoints(user3, 700, {from: owner});

    assert.equal(
      await zoningContract.loyaltyPoints.call(user1),
      586,
      'user1 has loyalty points',
    );

    assert.equal(
      await zoningContract.loyaltyPoints.call(user2),
      200,
      'user2 has loyalty points',
    );

    assert.equal(
      await zoningContract.loyaltyPoints.call(user3),
      700,
      'user3 has loyalty points',
    );

    const x = 143488;
    const y = 131903;
    zoneId = "143488-131903"

    await zoningContract.createZone(x, y, congocode, {from: user1});


    assert.equal(
      await zoningContract.getZoneOwner(zoneId),
      user1,
      'user1 is the zoneOwner',
    );

    await expectThrow(zoningContract.claimZone.call(zoneId,  {from: user2}));

    assert.equal(
      await zoningContract.claimZone.call(zoneId,  {from: user3}),
      true,
      'user3 should have enough loyalty points',
    );

    await zoningContract.claimZone(zoneId,  {from: user3});

    assert.equal(
      await zoningContract.getZoneOwner(zoneId),
      user3,
      'user3 should be the zoneOwner',
    );

    // Non-existence
    await expectThrow(zoningContract.claimZone.call("8765-12876",  {from: user2}));

  });

  it("Zone existence", async () => {

    for (var key in congo) {
      var value = congo[key];
      await zoningContract.updateCountry(congocode, key, value);
    }

    await zoningContract.createZone(143488, 131903, congocode, {from: user1});

    assert.equal(
      await zoningContract.zoneExists.call("143488-131903"),
      true,
      'Zone deployed',
    );

    // Zone just next (not registered)
    assert.equal(
      await zoningContract.zoneExists.call("143488-131902"),
      false,
      'Zone not deployed',
    );

  });



});
