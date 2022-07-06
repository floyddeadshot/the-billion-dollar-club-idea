import { account, accounts } from "./accounts";
import * as crypto from "crypto";
import ClubABI from "../artifacts/contracts/Club.sol/Club.json";
import { Club } from "../artifacts/contracts/types";
import { ethers } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";
//@ts-ignore
const circomlib = require("circomlibjs");
const main = async () => {
  const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const provider = new JsonRpcProvider("http://127.0.0.1:8545");
  const wallet = new ethers.Wallet(accounts[0].pvKey, provider);
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    ClubABI.abi,
    wallet
  ) as Club;
  // const toHex = (number: any, length = 32) =>
  //   "0x" +
  //   (number instanceof Buffer
  //     ? number.toString("hex")
  //     : BigInt(number).toString(16)
  //   ).padStart(length * 2, "0");

  const message = "I AM GOING TO THE CLUB FUCK YEAH";
  const pedersenHash = async (data: any) =>
    (await circomlib.buildBabyjub()).unpackPoint(
      (await circomlib.buildPedersenHash()).hash(data, undefined)
    )[0];
  async function signUp(account: account) {
    const secret = await wallet.signMessage(message);
    const hashedSecret = await pedersenHash(secret);
    const tx = await contract.signUp(ethers.utils.hexlify(hashedSecret), {
      gasLimit: 1000000,
    });
    console.log("Tx", tx);
  }
  signUp(accounts[0]);
};

main();
