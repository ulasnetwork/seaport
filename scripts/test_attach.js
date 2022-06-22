const hre = require("hardhat");

const { ethers, network } = require("hardhat");
const {
    seaportFixture,
} = require("../test/utils/fixtures");

const { deployContract } = require("../test/utils/contracts");

const {
    mnemonic_matemask_account1,
} = require('../secrets.json')

const deployConstants = require('../constants/constants')

async function main() {

    // const ConduitController = await hre.ethers.getContractFactory("ConduitController");
    // const conduitController = await ConduitController.attach("0xd6d0D4E942DbFB39fFba3E6415aBcB939cEAE180");
    // console.log('conduitController', conduitController)
    // console.log('conduitController:load success at:', conduitController.address)

    const Seaport = await hre.ethers.getContractFactory("Seaport");
    const seaport = await Seaport.attach("0xDD8b29086a6AE6560A9293320baCB5f7884f96D2");
    console.log('seaport', seaport)
    console.log("seaport:load success at:", seaport.address);

    const name = await seaport.name();
    console.log('name', name);

    const {
        version,
        domainSeparator,
        conduitController: controller,
    } = await seaport.information();

    console.log('version', version);
    console.log('domainSeparator', domainSeparator);
    console.log('controller', controller);

    const EIP1271WalletFactory = await ethers.getContractFactory("EIP1271Wallet");
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
