import * as dotenv from "dotenv";

import { HardhatUserConfig, subtask } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "xdeployer";

import { TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS } from "hardhat/builtin-tasks/task-names";

dotenv.config();

// Filter Reference Contracts
subtask(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS).setAction(
  async (_, __, runSuper) => {
    const paths = await runSuper();

    return paths.filter((p: any) => !p.includes("contracts/reference/"));
  }
);

const {
  alchemyApiKey,
  mnemonic_matemask_account1,
  mnemonic_matemask_account10

} = require('./secrets.json')

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.14",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
    overrides: {
      "contracts/conduit/Conduit.sol": {
        version: "0.8.14",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 100,
          },
        },
      },
      "contracts/conduit/ConduitController.sol": {
        version: "0.8.14",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 100,
          },
        },
      },
      "contracts/CREATE2SafeDeploy.sol":{
        version: "0.5.1",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      "contracts/ImmutableCreate2Factory.sol":{
        version: "0.5.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      }
    },
  },
  networks: {
    hardhat: {
      blockGasLimit: 30_000_000,
      throwOnCallFailures: false,
    },
    ropsten_test_account1: {
      url: process.env.ROPSTEN_URL || "",
      accounts: { mnemonic: mnemonic_matemask_account1 },
      gas: 30000000,      
    },

    rinkeby_test_account1: {
      url: process.env.RINKEBY_URL || "",
      accounts: { mnemonic: mnemonic_matemask_account1 },
      gas: 30000000,
      gasPrice:150000059 
    },

    rinkeby_test_account10: {
      url: process.env.RINKEBY_URL || "",
      accounts: { mnemonic: mnemonic_matemask_account10 },
      gas: 30000000,
      gasPrice:150000059 
    },

    local_test_account1: {
      url: "http://127.0.0.1:8545",
      accounts: { mnemonic: mnemonic_matemask_account1 },
      gas: 30000000,
      gasPrice:150000059 
    },


  },
  xdeploy: {
    contract: "Seaport",
    constructorArgsPath: "./SeaportArgs.ts",
    salt: "777",
    signer: process.env.PRIVATE_KEY,
    networks: [ "rinkeby"],
    rpcUrls: [process.env.RINKEBY_URL],
    gasLimit: 1.5 * 10 ** 7,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  // specify separate cache for hardhat, since it could possibly conflict with foundry's
  paths: { cache: "hh-cache" },
};

export default config;
