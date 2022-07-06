import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import { ethers } from "hardhat";
import { ContractFactory, utils } from "ethers";
//@ts-ignore
import * as circomlibjs from "circomlibjs";
import { accounts } from "../src/accounts";
const deploy = async () => {
  const Hasher = new ContractFactory(
    circomlibjs.mimcSpongecontract.abi,
    circomlibjs.mimcSpongecontract.createCode("mimcsponge", 220),
    await ethers.getSigner(accounts[0].address)
  );
  const hasher = await Hasher.deploy();
  const Verifier = await ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy();
  const Club = await ethers.getContractFactory("Club");
  const club = await Club.deploy(verifier.address, hasher.address, 10);
  console.log("Contract deployed to:", club.address);
};

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
