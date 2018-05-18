pragma solidity 0.4.23;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';

contract Countries is Ownable {
  using SafeMath for uint256;

  // Matrix of countries (zoom level 12)
  mapping (bytes2 => mapping(uint => uint[2][])) public countries;

  function updateCountry(bytes2 country, uint xIndex_, uint[2][] value)
    public
    onlyOwner
  {
    // TODO: require zoom level check
    countries[country][xIndex_] = value;
  }

  function getYArraysLength(uint[2][] yArrays)
    public
    pure
    returns (uint yCount_)
  {
    yCount_ = yArrays.length;
  }

  function getCountryColumn(uint xIndex_, bytes2 country)
    public
    view
    returns (uint[2][] column_)
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

    uint[2][] memory yArrays = getCountryColumn(x, country);

    if (getYArraysLength(yArrays) ==  0) {
      insideCountry_ = false;
    } else {
      for (uint i = 0; i < getYArraysLength(yArrays) ; i++){
        uint[2] memory yArray = yArrays[i];
        uint yLeft = yArray[0];
        uint yRight = yArray[1];

        if (y >= yLeft && y <= yRight) {
          insideCountry_ = true;
          break;
        }
      }

      if (insideCountry_ != true) {
        insideCountry_ = false;
      }
    }
  }
}
