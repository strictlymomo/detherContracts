pragma solidity ^0.4.23;


import './oraclize/oraclizeAPI_0.5.sol';
import './arachnid/strings.sol';
import './zeppelin/Ownable.sol';
import './Countries.sol';

contract DetherZoning is usingOraclize, Ownable  {
    using strings for *;

    Countries public countryChecker ;

    struct Zone {
      address zoneOwner;
      uint x;
      uint y;
      bytes2 country;
    }

    Zone[] public zonesArray;// to be read by client
    mapping(string => Zone) zonesMapping; // to be read by solidity

    // Speed access to zone existence
    mapping(uint => bool) public xIndex;
    mapping(uint => bool) public yIndex;

    mapping(address => uint) public loyaltyPoints;

    constructor(address countryCheckerAddress) public {
        countryChecker = Countries(countryCheckerAddress);
    }

    function updateXindex(uint x) public onlyOwner() {
      xIndex[x] = true;
    }

    function updateYindex(uint y) public onlyOwner() {
      yIndex[y] = true;
    }

    function getZoneArrayLength() public view returns (uint length){
      length = zonesArray.length;
    }

    function zoneIdentifierFromTileCoordinates(uint x, uint y) pure public returns (string) {
      string memory xString = uint2str(x);
      string memory yString = uint2str(y);
      string memory xy = strConcat(xString, "-", yString);
      return xy;
    }

    function TileCoordinatesFromZoneIdentifier(string zoneIdentifier) pure public returns (
      uint x,
      uint y
      ) {

      strings.slice memory s = zoneIdentifier.toSlice();
      strings.slice memory delim = "-".toSlice();
      string[] memory parts = new string[](s.count(delim) + 1);
      for(uint i = 0; i < parts.length; i++) {
        parts[i] = s.split(delim).toString();
      }
      x = parseInt(parts[0]);
      y = parseInt(parts[1]);
    }

    function createZone(uint x18, uint y18, bytes2 country) public returns (bool zoneAdded){

      require(x18 > 0);
      require(y18 > 0);
      require(x18 < 262144); // 68,719,476,736 tiles at zoom level 18, square root
      require(y18 < 262144);
      require( (xIndex[x18] == true &&  yIndex[y18] == true) == false);
      //TODO: check it is inside country
      require(countryChecker.isInsideCountry(x18, y18, country));

      Zone memory zone = Zone(msg.sender, x18, y18, country);
      zonesArray.push(zone);

      string memory id = zoneIdentifierFromTileCoordinates(x18, y18);
      zonesMapping[id] = zone;
      xIndex[x18] = true;
      yIndex[y18] = true;
      zoneAdded = true;
      return true;
    }

    function getZoneOwner(string identifier) public view returns(address zoneOwner){
      // TODO: check si zone existe
      Zone storage theZone = zonesMapping[identifier];
      zoneOwner = theZone.zoneOwner;
    }

    function simulateLoyaltyPoints(address winner, uint score) public onlyOwner() {
      loyaltyPoints[winner] = score;
    }

    function zoneExists(string zoneIdentifier) public view returns (bool) {
      uint x;
      uint y;
      (x, y) = TileCoordinatesFromZoneIdentifier(zoneIdentifier);

      return ((xIndex[x] == true) && (yIndex[y] == true));

    }

    function claimZone(string zoneIdentifier) public returns (bool) {

      require(zoneExists(zoneIdentifier) == true);

      Zone memory zone = zonesMapping[zoneIdentifier];

      uint ownerLoyaltyPoint = loyaltyPoints[zone.zoneOwner];
      uint claimerloyaltyPoints = loyaltyPoints[msg.sender];

      require(claimerloyaltyPoints > ownerLoyaltyPoint);
      zonesMapping[zoneIdentifier].zoneOwner = msg.sender;
      return true;
    }


}
