const hre = require("hardhat");

const { ethers, network } = require("hardhat");
const {
    seaportFixture,
} = require("../test/utils/fixtures");

const {
    fixtureERC20,
    fixtureERC721,
    fixtureERC1155,
    tokensFixture,
} = require("../test/utils/fixtures/tokens");


const {
    mnemonic_matemask_account1,
    mnemonic_matemask_account9,
    mnemonic_matemask_account10,
    mnemonic_matemask_account11,
    mnemonic_matemask_account12
} = require('../secrets.json')



async function main() {

    // const ConduitController = await hre.ethers.getContractFactory("ConduitController");
    // const conduitController = await ConduitController.attach("0xd6d0D4E942DbFB39fFba3E6415aBcB939cEAE180");
    // console.log('conduitController', conduitController)
    // console.log('conduitController:load success at:', conduitController.address)

    const Seaport = await hre.ethers.getContractFactory("Seaport");
    const seaport = await Seaport.attach("0xDD8b29086a6AE6560A9293320baCB5f7884f96D2");
    console.log("seaport:load success at:", seaport.address);

    // const name = await seaport.name();
    // console.log('name', name)

    const provider = await ethers.provider;

    const noproviderOwner = new ethers.Wallet.fromMnemonic(mnemonic_matemask_account1);
    const owner = await noproviderOwner.connect(provider);

    const {
        testERC20,
        mintAndApproveERC20,
        getTestItem20,
        testERC721,
        set721ApprovalForAll,
        mint721,
        mint721s,
        mintAndApprove721,
        getTestItem721,
        getTestItem721WithCriteria,
        testERC1155,
        set1155ApprovalForAll,
        mint1155,
        mintAndApprove1155,
        getTestItem1155WithCriteria,
        getTestItem1155,
        testERC1155Two,
        tokenByType,
        createTransferWithApproval,
    } = await tokensFixture(owner);

    const noproviderSeller = new ethers.Wallet.fromMnemonic(mnemonic_matemask_account1);
    const seller = await noproviderSeller.connect(provider);

    const noproviderBuyer = new ethers.Wallet.fromMnemonic(mnemonic_matemask_account1);
    const buyer = await noproviderBuyer.connect(provider);

    const noproviderZone = new ethers.Wallet.fromMnemonic(mnemonic_matemask_account1);
    const zone = await noproviderBuyer.connect(provider);

    const EIP1271WalletFactory = await ethers.getContractFactory("EIP1271Wallet");
    const sellerContract = await EIP1271WalletFactory.deploy(seller.address);
    const buyerContract = await EIP1271WalletFactory.deploy(buyer.address);


    // const nftId = await mintAndApprove721(
    //     seller,
    //     marketplaceContract.address
    // );

}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
