import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import { ethers } from "hardhat";
import { utils } from "ethers";

const deploy = async () => {
  const FuzzyIdentity = await ethers.getContractFactory("Hack");
  const fuzzyIdentity = await FuzzyIdentity.deploy();
  console.log("Contract deployed to:", fuzzyIdentity.address);
  await fuzzyIdentity.overflow({ gasLimit: 1000000 });
};

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
