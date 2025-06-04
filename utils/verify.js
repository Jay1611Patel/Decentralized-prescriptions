const { run } = require("hardhat");
// const { modules } = require("web3")

async function verify(contractAddress, args) {
  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguements: args,
    });
  } catch (e) {
    if (e.message.toLowerCase().includes("already Verified")) {
      console.log("Already verified");
    } else {
      console.log(e);
    }
  }
}

module.exports = { verify };
