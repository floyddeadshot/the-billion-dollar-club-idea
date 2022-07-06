//@ts-nocheck
require("@typechain/hardhat");
require("@nomiclabs/hardhat-ethers");

require("dotenv").config();
//require("@openzeppelin/hardhat-upgrades");

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const MUMBAI_PRIVATE_KEY = process.env.MUMBAI_PRIVATE_KEY;

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config = {
  solidity: "0.8.9",
  typechain: {
    outDir: "artifacts/contracts/types",
    target: "ethers-v5",
  },
  networks: {
    hardhat: { gas: 2100000, gasPrice: 8000000000 },
    /*mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [`${MUMBAI_PRIVATE_KEY}`],
    },*/
  },
};

export default config;
