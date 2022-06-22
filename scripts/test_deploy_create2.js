const hre = require("hardhat");

const { ethers, network } = require("hardhat");


async function main() {
    const ImmutableCreate2Factory = await hre.ethers.getContractFactory("ImmutableCreate2FactoryImpl");
    const immutableCreate2Factory = await ImmutableCreate2Factory.attach("0x8F7f1c65C0aeA4fC262b0f62e37aC8d1cc34359F");

    console.log('immutableCreate2Factory:deploy success at:', immutableCreate2Factory)

    //0x26bf7C11042EBBb8FF00075Db1dC49b556168F95
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
