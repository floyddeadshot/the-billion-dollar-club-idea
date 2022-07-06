import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import { ethers } from "hardhat";
import { utils } from "ethers";

const deploy = async () => {
  const FuzzyIdentity = await ethers.getContractFactory("BondFactory");
  const fuzzyIdentity = await FuzzyIdentity.deploy();
  console.log("Contract deployed to:", fuzzyIdentity.address);
};

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
