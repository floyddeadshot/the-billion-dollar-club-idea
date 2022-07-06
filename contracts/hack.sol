pragma solidity 0.8.9;
import "hardhat/console.sol";
contract Hack {
    uint256 maxSupply;
    constructor(){
        maxSupply=1e30 ether;
    }
    function overflow() public{
        console.log("hm",maxSupply);
        console.log("hm",maxSupply>maxSupply*maxSupply);
    }
}