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

    const ConduitController = await hre.ethers.getContractFactory("ConduitController");
    console.log('ConduitController', ConduitController)
    // const conduitController = await ConduitController.deploy();

    // console.log('conduitController:deploy success at:', conduitController.address)

    // const provider = await ethers.provider;
    // const noproviderOwner = new ethers.Wallet.fromMnemonic(mnemonic_matemask_account1);
    // const owner = await noproviderOwner.connect(provider);
    // const directMarketplaceContract = await deployContract(
    //     "Consideration",
    //     owner,
    //     conduitController.address
    // );

    // console.log('directMarketplaceContract', directMarketplaceContract)

    // const Seaport = await hre.ethers.getContractFactory("Seaport");
    // console.log('Seaport', Seaport)
    // const seaport = await Seaport.deploy(
    //     conduitController.address
    // );

    // console.log("seaport:deployed success at:", seaport.address);

}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
