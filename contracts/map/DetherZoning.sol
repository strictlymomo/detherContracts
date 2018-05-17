pragma solidity 0.4.23;

// contract
import 'oraclize-api/usingOraclize.sol'; // EthPM
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import './Countries.sol';

// library
import './arachnid/strings.sol';

contract DetherZoning is usingOraclize, Ownable, Countries  {
    using strings for *;

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

    function TileCoordinatesFromZoneIdentifier(string zoneId) pure public returns (
      uint x,
      uint y
      ) {

      strings.slice memory s = zoneId.toSlice();
      strings.slice memory delim = "-".toSlice();
      string[] memory parts = new string[](s.count(delim) + 1);
      for(uint i = 0; i < parts.length; i++) {
        parts[i] = s.split(delim).toString();
      }
      x = parseInt(parts[0]);
      y = parseInt(parts[1]);
    }

    function createZone(uint x18, uint y18, bytes2 country) public returns (bool zoneAdded){
      require(x18 >= 0);
      require(y18 >= 0);
      require(x18 <= 262144); // 68,719,476,736 tiles at zoom level 18, square root
      require(y18 <= 262144);
      require(isInsideCountry(x18, y18, country));

      // check if zone already exists
      if ( (xIndex[x18] == true &&  yIndex[y18] == true) == false) {
        // zone does not yet exist, create it
        Zone memory zone = Zone(msg.sender, x18, y18, country);
        zonesArray.push(zone);

        string memory id = zoneIdentifierFromTileCoordinates(x18, y18);
        zonesMapping[id] = zone;
        xIndex[x18] = true;
        yIndex[y18] = true;
        zoneAdded = true;
        return true;
      }

      // zone already exists
      return false;
    }

    function getZoneOwner(string zoneId) public view returns(address zoneOwner){
      // TODO: check si zone existe
      Zone storage theZone = zonesMapping[zoneId];
      zoneOwner = theZone.zoneOwner;
    }

    function simulateLoyaltyPoints(address winner, uint score) public onlyOwner() {
      loyaltyPoints[winner] = score;
    }

    function zoneExists(string zoneId) public view returns (bool) {
      uint x;
      uint y;
      (x, y) = TileCoordinatesFromZoneIdentifier(zoneId);

      return ((xIndex[x] == true) && (yIndex[y] == true));

    }

    function claimZone(string zoneId) public returns (bool) {
      require(zoneExists(zoneId) == true);

      Zone memory zone = zonesMapping[zoneId];

      uint ownerLoyaltyPoint = loyaltyPoints[zone.zoneOwner];
      uint claimerloyaltyPoints = loyaltyPoints[msg.sender];

      require(claimerloyaltyPoints > ownerLoyaltyPoint);
      zonesMapping[zoneId].zoneOwner = msg.sender;

      return true;
    }
}
