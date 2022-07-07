import { account, accounts } from "./accounts";
import * as crypto from "crypto";
import ClubABI from "../artifacts/contracts/Club.sol/Club.json";
import { Club } from "../artifacts/contracts/types";
import { BigNumber, ethers } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";
import BigInteger from "big-integer";
import Web3 from "web3";
import merkleTree from "fixed-merkle-tree";
const buildGroth16 = require("websnark/src/groth16");
const websnarkUtils = require("websnark/src/utils");
import circuit from "../build/circuits/withdraw.json";
//@ts-ignore
const circomlib = require("circomlibjs");
const main = async () => {
  const web3 = new Web3("http://127.0.0.1:8545");
  const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const provider = new JsonRpcProvider("http://127.0.0.1:8545");
  const message = "I AM GOING TO THE CLUB FUCK YEAH";
  const pedersenHash = async (data: any) =>
    (await circomlib.buildBabyjub()).unpackPoint(
      (await circomlib.buildPedersenHash()).hash(data, undefined)
    )[0];
  const toHex = (number: any, length = 32) =>
    "0x" +
    (number instanceof Buffer
      ? number.toString("hex")
      : BigNumber.from(number).toHexString().slice(3)
    ).padStart(length * 2, "0");
  async function signUp(account: account) {
    const wallet = new ethers.Wallet(account.pvKey, provider);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      ClubABI.abi,
      wallet
    ) as Club;
    const secret = await wallet.signMessage(message);
    const hashedSecret = await pedersenHash(secret);
    console.log("Secret", secret);
    try {
      const tx = await contract.signUp(toHex(hashedSecret), {
        gasLimit: 1000000,
      });
      console.log("Tx", tx);
      await tx.wait();
    } catch (error) {
      console.error(error);
    }
  }
  async function generateMerkleProof(account: account, secret: string) {
    const hashedSecret = await pedersenHash(secret);
    const web3Contract = new web3.eth.Contract(
      ClubABI.abi as any,
      CONTRACT_ADDRESS
    );
    console.log("Getting contract state...");
    const events = await web3Contract.getPastEvents("SignUp", {
      fromBlock: 0,
      toBlock: "latest",
    });
    const leaves = events
      .sort((a, b) => a.returnValues.leafIndex - b.returnValues.leafIndex) // Sort events in chronological order
      .map((e) => e.returnValues.commitment);
    const tree = new merkleTree(20, leaves);
    // Find current commitment in the tree
    let signUpEvent = events.find(
      (e) => e.returnValues.commitment === toHex(hashedSecret)
    );
    let leafIndex = signUpEvent ? signUpEvent.returnValues.leafIndex : -1;
    console.log("LeafIndex", leafIndex);
    const { pathElements, pathIndices } = tree.path(leafIndex);
    return { pathElements, pathIndices, root: tree.root };
  }
  async function generateSnarkProof(account: account, secret: string) {
    const { root, pathElements, pathIndices } = await generateMerkleProof(
      account,
      secret
    );
    // Prepare circuit input
    const input = {
      // Public snark inputs
      root: root,
      recipient: BigNumber.from(account.address),
      relayer: 0,
      fee: 0,
      refund: 0,

      // Private snark inputs
      secret: secret,
      age: account.age,
      pathElements: pathElements,
      pathIndices: pathIndices,
    };

    console.log("Generating SNARK proof...");
    const proofData = await websnarkUtils.genWitnessAndProve(
      await buildGroth16(),
      input,
      circuit,
      proving_key
    );
    const { proof } = websnarkUtils.toSolidityInput(proofData);

    const args = [
      toHex(input.root),
      toHex(input.nullifierHash),
      toHex(input.recipient, 20),
      toHex(input.relayer, 20),
      toHex(input.fee),
      toHex(input.refund),
    ];

    return { proof, args };
  }
  async function checkSignUp(account: account) {
    const wallet = new ethers.Wallet(account.pvKey, provider);
    generateSnarkProof(account, await wallet.signMessage(message));
  }
  //await Promise.all(accounts.map(async (account) => await signUp(account)));
  checkSignUp(accounts[0]);
};

main();
