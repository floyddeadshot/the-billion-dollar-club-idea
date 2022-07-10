import { account, accounts } from "./accounts";
import * as crypto from "crypto";
import ClubABI from "../artifacts/contracts/Club.sol/Club.json";
import { Club } from "../artifacts/contracts/types";
import { BigNumber, ethers } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";
import bigInt from "big-integer";
import Web3 from "web3";
import merkleTree from "fixed-merkle-tree";
//@ts-ignore
import * as snarkjs from "snarkjs";
//const buildGroth16 = require("websnark/src/groth16");
//const websnarkUtils = require("websnark/src/utils");
import circuit from "../circuits/checkSignUp_constraints.json";
import fs from "fs";
import { ConstructorInitializableMock__factory } from "../artifacts/contracts/types/factories/openzeppelin/contracts/mocks/InitializableMock.sol";
import { hasJSDocParameterTags } from "typescript";
import { Buffer } from "buffer";
import { buffer } from "stream/consumers";
const proving_key = fs.readFileSync(
  __dirname + "\\checkSignUp_0001.zkey"
).buffer;
console.log("proving_key", proving_key);
//@ts-ignore
const circomlib = require("circomlibjs");
const main = async () => {
  const OMIT_FIRST_SECRET_LETTERS = 132 - 62;
  const web3 = new Web3("http://127.0.0.1:8545");
  const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const provider = new JsonRpcProvider("http://127.0.0.1:8545");
  const message = "I AM GOING TO THE CLUB FUCK YEAH";
  const pedersenHash = async (data: any) =>
    (await circomlib.buildBabyjub()).unpackPoint(
      (await circomlib.buildPedersenHash()).hash(data)
    )[0];
  const toHex = (number: any, length = 32) =>
    "0x" +
    (number instanceof Buffer
      ? number.toString("hex")
      : BigNumber.from(number).toHexString().slice(2)
    ).padStart(length * 2, "0");
  async function signUp(account: account) {
    const wallet = new ethers.Wallet(account.pvKey, provider);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      ClubABI.abi,
      wallet
    ) as Club;
    const secret =
      "0x" +
      (await wallet.signMessage(message)).slice(OMIT_FIRST_SECRET_LETTERS);
    console.log("Secret", secret);
    let bufferSecret = Buffer.alloc(31);
    console.log("buffer secret", bufferSecret.fill(secret));
    const hashedSecret = await pedersenHash(bufferSecret);
    console.log("Hashed secret", hashedSecret);
    console.log("Hex secret", toHex(hashedSecret));
    console.log("length of ", toHex(hashedSecret).length);
    console.log("As a number", Number(toHex(hashedSecret)));
    console.log(
      "alex number",
      Number(
        "0x9bc2050d47e544c402fc3c58c46029ed1668b274aeb307803b6a8b8c78e3d815"
      )
    );
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
    console.log("mkfrkmd hashed", hashedSecret);
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
    console.log("Secret", secret);
    console.log("Hashed Secret", Number(toHex(await pedersenHash(secret))));
    const { root, pathElements, pathIndices } = await generateMerkleProof(
      account,
      secret
    );
    console.log("Root", root);
    // Prepare circuit input
    const input = {
      // Public snark inputs
      root: root,
      recipient: account.address,
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
    // const proofData = await websnarkUtils.genWitnessAndProve(
    //   await buildGroth16(),
    //   input,
    //   circuit,
    //   proving_key
    // );
    // const { proof } = websnarkUtils.toSolidityInput(proofData);

    // const args = [
    //   toHex(input.root),
    //   toHex(input.recipient, 20),
    //   toHex(input.relayer, 20),
    //   toHex(input.fee),
    //   toHex(input.refund),
    // ];
    console.log("wft", snarkjs.groth16);
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      "./circuits/checkSignUp_js/checkSignUp.wasm",
      "./circuits/checkSignUp_0001.zkey"
    );

    console.log("Proof: ");
    console.log(JSON.stringify(proof, null, 1));

    const vKey = JSON.parse(
      fs.readFileSync("verification_key.json").toString()
    );

    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    if (res === true) {
      console.log("Verification OK");
    } else {
      console.log("Invalid proof");
    }

    //return { proof, args };
  }
  async function checkSignUp(account: account) {
    const wallet = new ethers.Wallet(account.pvKey, provider);
    await generateSnarkProof(
      account,
      "0x" + (await wallet.signMessage(message)).slice(2)
    );
    //console.log("proof", proof);
  }
  //await Promise.all(accounts.map(async (account) => await signUp(account)));
  await signUp(accounts[0]);
  checkSignUp(accounts[0]);
};

main();
