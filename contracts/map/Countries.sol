pragma solidity 0.4.23;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';

contract Countries is Ownable {
  using SafeMath for uint256;

  // Matrix of countries (zoom level 12)
  mapping (bytes2 => mapping(uint => uint[])) public countries;

  function updateCountry(bytes2 country, uint xIndex_, uint[] values)
    public
    onlyOwner
  {
    require(pairCount % 2 == 0);
    uint pairCount = values.length / 2;
    // we need an even amount of array values

    // TODO: require zoom level check
    countries[country][xIndex_] = values;
  }

  function toArray(bytes _bytes)
    internal
    returns (uint[][] _ptr)
  {
    assembly {
      // Should probably do a modulo check to see if there is a zero remainder first
      let total_bytes := div(mload(_bytes), 0x20)

      _ptr := mload(0x40)
      switch lt(_ptr, msize())
      case 1 {
        _ptr := msize()
      }

      // if no data goto end
      jumpi(copy_end, eq(0, total_bytes))

      let start_offset := add(_bytes, 0x20)
      let num_arrays := mload(start_offset)
      let array_offset := 0
      let idx_arrays := 0
      let num_elements := 0

      // Find the total amount of elements
      length_start:
      jumpi(length_end, eq(idx_arrays, num_arrays))
      array_offset := mload(add(start_offset, add(0x20, mul(idx_arrays,0x20))))
      // Correct the pointers
      mstore(add(start_offset, add(0x20, mul(idx_arrays,0x20))), add(_ptr, array_offset))
      num_elements := add(num_elements, mload(array_offset))
      idx_arrays := add(idx_arrays, 1)
      jump(length_start)
      length_end:

      let idx_bytes := 0

      // Copy all the data to the byte array
      copy_start:
      jumpi(copy_end, eq(total_bytes, idx_bytes))
      mstore(add(_ptr, mul(idx_bytes, 0x20)), mload(add(start_offset, mul(idx_bytes, 0x20))))
      idx_bytes := add(idx_bytes, 1)
      jump(copy_start)
      copy_end:

      // Set the free memory pointer
      mstore(0x40, add(_ptr, mul(0x20, total_bytes)))
    }
  }

  // https://github.com/willitscale/learning-solidity/blob/master/support/NESTED_ARRAYS_NOT_IMPLEMENTED.MD#32-convert-bytes-to-a-nested-array
  function updateCountryBatch(bytes2 country, uint[] xIndexBatch_, bytes valueBatch)
    public
    onlyOwner
  {
    uint[][] memory parsed = toArray(valueBatch);

    for (uint i = 0; i < xIndexBatch_.length; i++) {
      updateCountry(country, xIndexBatch_[i], parsed[i]);
    }
  }

  function getYArraysLength(uint[] yArrays)
    public
    pure
    returns (uint yCount_)
  {
    yCount_ = yArrays.length;
  }

  function getCountryColumn(uint xIndex_, bytes2 country)
    public
    view
    returns (uint[] column_)
  {
    column_ = countries[country][xIndex_];
  }

  function getParentTile18to12(uint x18, uint y18)
    public
    pure
    returns (uint x12_, uint y12_)
  {
    x12_ = x18.div(2**6);
    y12_ = y18.div(2**6);
  }

  function isInsideCountry(uint x18, uint y18, bytes2 country)
    public
    view
    returns (bool insideCountry_)
  {
    uint x;
    uint y;
    (x, y) = getParentTile18to12(x18, y18);

    uint[] memory yArrays = getCountryColumn(x, country);
    uint yArraysLen = getYArraysLength(yArrays);

    insideCountry_ = false;
    if (yArraysLen >  0) {
      for (uint i = 0; i < yArraysLen / 2; i += 2){
        uint yLeft = yArrays[i];
        uint yRight = yArrays[i+1];

        if (y >= yLeft && y <= yRight) {
          insideCountry_ = true;
          break;
        }
      }
    }
  }
}
