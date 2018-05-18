pragma solidity 0.4.23;

// contract
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import './Countries.sol';

contract DetherZoning is Ownable, Countries  {
    struct Zone {
      address zoneOwner;
      uint x;
      uint y;
      bytes2 country;
      bool exists;
    }

    Zone[] public zoneList;

    //      x18             y18     the zone
    mapping(uint => mapping(uint => Zone)) internal zoneMapping;

    modifier validX18(uint x18) {
      require(x18 >= 0);
      require(x18 <= 262144); // 68,719,476,736 tiles at zoom level 18, square root
      _;
    }

    modifier validY18(uint y18) {
      require(y18 >= 0);
      require(y18 <= 262144); // 68,719,476,736 tiles at zoom level 18, square root
      _;
    }

    modifier zoneExists(uint x18, uint y18) {
      require(zoneMapping[x18][y18].exists == true);
      _;
    }

    modifier zoneDoesNotExist(uint x18, uint y18) {
      require(zoneMapping[x18][y18].exists == false);
      _;
    }

    function getZoneCount()
      public
      view
      returns (uint zoneCount_)
    {
      zoneCount_ = zoneList.length;
    }

    function doesZoneExist(uint x18, uint y18)
      public
      validX18(x18)
      validY18(y18)
      view
      returns (bool zoneExists_)
    {
      zoneExists_ = zoneMapping[x18][y18].exists;
    }

    function createZone(uint x18, uint y18, bytes2 country)
      public
      onlyOwner
      validX18(x18)
      validY18(y18)
      zoneDoesNotExist(x18, y18)
    {
      require(isInsideCountry(x18, y18, country));

      Zone memory zone = Zone(msg.sender, x18, y18, country, true);
      zoneList.push(zone);
      zoneMapping[x18][y18] = zone;
    }

    function getZoneOwner(uint x18, uint y18)
      public
      view
      validX18(x18)
      validY18(y18)
      zoneExists(x18, y18)
      returns (address zoneOwner_)
    {
      zoneOwner_ = zoneMapping[x18][y18].zoneOwner;
    }

    /* function claimZone(uint x18, uint y18, uint loyaltyPointsClaimer, uint loyaltyPointsOwner)
      public
      validX18(x18)
      validY18(y18)
      zoneExists(x18, y18)
      onlyOwner
      returns (bool claimedZone_)
    {
      Zone memory zone = zoneMapping[x18][y18];

      require(claimerloyaltyPoints > ownerLoyaltyPoint);
      zoneMapping[zoneId].zoneOwner = msg.sender;

      claimedZone_ = true;
    } */
}
