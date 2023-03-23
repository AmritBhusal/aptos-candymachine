import assert from "assert";
import fs from "fs";
import path from "path";
import { NODE_URL, FAUCET_URL } from "./common";
import { AptosAccount, AptosClient, TxnBuilderTypes, MaybeHexString, HexString, FaucetClient } from "aptos";

const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

const moduleAddress = "0x8035a63a18798115679466eef240aca66364707044f0ac7484e4c462c8310ae9";

class CoinClient extends AptosClient {
    constructor() {
      super(NODE_URL);
    }


    /** Register the receiver account to receive transfers for the new coin. */
  async registerCandy(coinTypeAddress: HexString, coinReceiver: AptosAccount): Promise<string> {
    const rawTxn = await this.generateTransaction(coinReceiver.address(), {
      function: `${moduleAddress}::candymachine::mint_script`,
      type_arguments: [`${coinTypeAddress.hex()}::candymachine::mint_script`],
      arguments: [],
    });

    const bcsTxn = await this.signTransaction(coinReceiver, rawTxn);
    const pendingTxn = await this.submitTransaction(bcsTxn);

    return pendingTxn.hash;
  }

 /** Mints the newly created coin to a specified receiver address */
 async mintCandy(minter: AptosAccount, receiverAddress: HexString, amount: number | bigint): Promise<string> {
    const rawTxn = await this.generateTransaction(minter.address(), {
      function: `${moduleAddress}::candymachine::mint_script`,
      type_arguments: [`${minter.address()}::candymachine::mint_script`],
      arguments: [receiverAddress.hex(), amount],
    });

    const bcsTxn = await this.signTransaction(minter, rawTxn);
    const pendingTxn = await this.submitTransaction(bcsTxn);

    return pendingTxn.hash;
  }

  /** Return the balance of the newly created coin */
  async getBalance(accountAddress: MaybeHexString, coinTypeAddress: HexString): Promise<string | number> {
    try {
      const resource = await this.getAccountResource(
        accountAddress,
        `${moduleAddress}::candymachine::mint<${coinTypeAddress.hex()}::candymachine::mint_script>`,
      );

      return parseInt((resource.data as any)["candy"]["value"]);
    } catch (_) {
      return 0;
    }
  }
}

    async function main() {
        assert(process.argv.length === 3, "Expecting an argument that points to the moon_coin directory.");
      
        const client = new CoinClient();
        const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);
      
        // Create two accounts, Alice and Bob, and fund Alice but not Bob
        const alice = new AptosAccount();
        const bob = new AptosAccount();
      
        console.log("\n=== Addresses ===");
        console.log(`Alice: ${alice.address()}`);
        console.log(`Bob: ${bob.address()}`);
      
        await faucetClient.fundAccount(alice.address(), 100_000_000);
        await faucetClient.fundAccount(bob.address(), 100_000_000);
      
        await new Promise<void>((resolve) => {
          readline.question("Update the module with Alice's address, compile, and press enter.", () => {
            resolve();
            readline.close();
          });
        });
      
        // :!:>publish
        const modulePath = process.argv[2];
        const packageMetadata = fs.readFileSync(path.join(modulePath, "build", "Examples", "package-metadata.bcs"));
        const moduleData = fs.readFileSync(path.join(modulePath, "build", "Examples", "bytecode_modules", "moon_coin.mv"));
      
        console.log("Publishing MoonCoin package.");
        let txnHash = await client.publishPackage(alice, new HexString(packageMetadata.toString("hex")).toUint8Array(), [
          new TxnBuilderTypes.Module(new HexString(moduleData.toString("hex")).toUint8Array()),
        ]);
        await client.waitForTransaction(txnHash, { checkSuccess: true }); // <:!:publish
      
        console.log("Bob registers the newly created coin so he can receive it from Alice");
        txnHash = await client.registerCandy(alice.address(), bob);
        await client.waitForTransaction(txnHash, { checkSuccess: true });
        console.log(`Bob's initial MoonCoin balance: ${await client.getBalance(bob.address(), alice.address())}.`);
      
        console.log("Alice mints Bob some of the new coin.");
        txnHash = await client.mintCandy(alice, bob.address(), 100);
        await client.waitForTransaction(txnHash, { checkSuccess: true });
        console.log(`Bob's updated MoonCoin balance: ${await client.getBalance(bob.address(), alice.address())}.`);
      }
      
    if (require.main === module) {
        main().then((resp) => console.log(resp));
    }



