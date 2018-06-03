/* global web3, assert */
const path = require('path');

exports.expectThrow = async (promise) => {
  try {
    await promise;
  } catch (error) {
    const invalidJump = error.message.search('invalid JUMP') >= 0;
    const invalidOpcode = error.message.search('invalid opcode') >= 0;
    const outOfGas = error.message.search('out of gas') >= 0;
    const revert = error.message.search('revert') >= 0;
    assert(invalidJump || invalidOpcode || outOfGas || revert, `Expected throw, got '${error}' instead`);
    return;
  }
  assert.fail('Expected throw not received');
};

exports.waitForMined = tx => new Promise((resolve, reject) => {
  const setIntervalId = setInterval(() => {
    web3.eth.getTransactionReceipt(tx, (err, receipt) => {
      if (err) return reject(err.message);
      if (receipt) {
        clearInterval(setIntervalId);
        return resolve(receipt);
      }
      return null;
    });
  }, 1000);
});

exports.hexEncode = (str) => {
  let result = '';
  for (let i = 0; i < str.length; i += 1) {
    const hex = str.charCodeAt(i).toString(16);
    result += `${hex}`.slice(-4);
  }
  return `0x${result}`;
};

exports.toNBytes = (str, n) => {
  let buffer = '';
  for (let i = 0; i < n; i += 1) {
    buffer += str[i] ? str[i].charCodeAt(0).toString(16) : '00';
  }
  return buffer;
};

const convertBaseFn = (baseFrom, baseTo) => num => (
  parseInt(num, baseFrom).toString(baseTo)
);

const convertBase = {
  bin2dec: convertBaseFn(2, 10),
  bin2hex: convertBaseFn(2, 16),
  dec2bin: convertBaseFn(10, 2),
  dec2hex: convertBaseFn(10, 16),
  hex2bin: convertBaseFn(16, 2),
  hex2dec: convertBaseFn(16, 10),
};

exports.intTo5bytes = (intVal) => {
  const isNegative = intVal < 0;

  if (isNegative) intVal *= -1; // eslint-disable-line no-param-reassign

  const hexVal = convertBase.dec2hex(intVal);

  let result = hexVal;

  for (let i = 0; i + hexVal.length < 8; i += 1) {
    result = `0${result}`;
  }

  // if negative prepend with 01
  // if positive prepend with 00
  return isNegative ? `01${result}` : `00${result}`;
};

exports.uintTo3bytes = (intVal) => {
  const hexVal = convertBase.dec2hex(intVal);
  let result = hexVal;

  for (let i = 0; i + hexVal.length < 6; i += 1) {
    result = `0${result}`;
  }

  return result;
};

exports.uintTo32bytes = (intVal) => {
  const hexVal = convertBase.dec2hex(intVal);
  let result = hexVal;

  for (let i = 0; i + hexVal.length < 64; i += 1) {
    result = `0${result}`;
  }

  return result;
};

exports.intTo2bytes = (intVal) => {
  const hexVal = convertBase.dec2hex(intVal);

  let result = hexVal;

  for (let i = 0; i + hexVal.length < 4; i += 1) {
    result = `0${result}`;
  }

  return result;
};

exports.intTobytes = (intVal) => {
  const hexVal = convertBase.dec2hex(intVal);

  let result = hexVal;

  for (let i = 0; i + hexVal.length < 2; i += 1) {
    result = `0${result}`;
  }

  return result;
};

exports.toAsciiStripZero = str => (
  web3.toAscii(str).replace(/\0/g, '')
);

exports.weiToEth = bnNum => (
  web3.fromWei(bnNum, 'ether')
);

exports.ethToWei = num => (
  web3.toWei(num, 'ether')
);

exports.flatten = arr => arr.reduce((acc, val) => acc.concat(val), []);

// https://github.com/willitscale/learning-solidity/blob/master/support/NESTED_ARRAYS_NOT_IMPLEMENTED.MD
const toBytesUint2dim = (arr) => {
  const outerArrayCount = arr.length;
  let __byteArr__ = [];

  // length of outer array
  __byteArr__.push(exports.uintTo32bytes(outerArrayCount));

  // temp add "location of X nested array" placeholder
  arr.forEach((_, nestedArrayIdx) => {
    __byteArr__.push(`inner:${nestedArrayIdx} location`);
  });

  // add items of nested array + update "location of X (this) nested array"
  arr.forEach((nestedArr, nestedArrayIdx) => {

    // add number of items in this inner array
    __byteArr__.push(`inner:${nestedArrayIdx} length ` + exports.uintTo32bytes(nestedArr.length))

    let items_added_count = 0;
    nestedArr.forEach((item) => {
      // add actual item of inner array
      __byteArr__.push(`inner:${nestedArrayIdx} value  ` + exports.uintTo32bytes(item))
      items_added_count += 1;
    });
  });

  // update start location of each nested array
  for (let innerArrayIdx = 0; innerArrayIdx < outerArrayCount; innerArrayIdx++) {
    const firstItemIdx = __byteArr__.findIndex(item => (
      item.startsWith(`inner:${innerArrayIdx} value`)
    ));
    const lastItemIndex = __byteArr__.length - 1 - __byteArr__.slice().reverse().findIndex(item => (
      item.startsWith(`inner:${innerArrayIdx} value`)
    ));

    const innerLocIdx = __byteArr__.findIndex(b => (
      b.startsWith(`inner:${innerArrayIdx} location`)
    ));

    __byteArr__ = [
      ...__byteArr__.slice(0, innerLocIdx),
      __byteArr__[innerLocIdx] + ' ' + exports.uintTo32bytes((firstItemIdx - 1) * 32),
      ...__byteArr__.slice(innerLocIdx + 1),
    ];
  }

  // console.log(JSON.stringify(__byteArr__.map((b, idx) => `${uintTo32bytes(idx * 32)} - ${b}`), null, 4));

  __byteArr__ = __byteArr__.map(b => b.slice(-64));

  const byteArrayAsString = `0x${__byteArr__.join('')}`;

  // console.log('\n\n\n', byteArrayAsString, '\n\n\n\n');
  return byteArrayAsString;
};

exports.addCountryFileToZoning = async (deployAddr, web3, zoningContract, countryCode, batchSize) => {
  let country = require(path.join(__dirname, '..', 'zones', `${countryCode}.json`));

  // NOTE: stripping empty entries like the 2nd one below
  //
  // {
  //   "231": [21, 29],
  //   "232": [],
  //   "233": [20, 30],
  // }
  country = Object.keys(country)
    .reduce((memo, xVal) => {
      // remove xVals which have an empty array as value, meaning no yVals for this xVal
      const yVals = exports.flatten(country[xVal]);
      return !yVals.length ? memo : { ...memo, [xVal]: country[xVal] };
    }, {});

  const xData = Object.keys(country);
  const yData = Object.keys(country).map(x => country[x]).map(arrOfArrs => exports.flatten(arrOfArrs));

  const batchCount = Math.floor((xData.length / batchSize) + 1);
  let gasCost = web3.toBigNumber(0);

  const balanceBefore = web3.fromWei(await web3.eth.getBalance(deployAddr));

  for (let  batchIdx = 0; batchIdx < batchCount; batchIdx++) {
    const xBatch = xData.slice(batchIdx * batchSize, batchIdx * batchSize + batchSize);
    const yBatch = yData.slice(batchIdx * batchSize, batchIdx * batchSize + batchSize);
    const tx = await zoningContract.updateCountryBatch(web3.fromAscii(countryCode), xBatch, toBytesUint2dim(yBatch));
    gasCost = gasCost.add(web3.toBigNumber(tx.receipt.gasUsed));
  }

  const balanceAfter = web3.fromWei(await web3.eth.getBalance(deployAddr));

  return {
    batchCount,
    gasCost: gasCost.toString(),
    ethCost: balanceBefore.sub(balanceAfter).toString(),

    // used for checking in specs
    xData,
    yData,
  };
};
