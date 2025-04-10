import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { MovePumpTransaction, TokenFactory } from 'meme-framework/core';
import { Command } from 'commander';
import { SuiClient } from '@mysten/sui/client';

const program = new Command();

program.name("meme-framework").version("0.0.1");

program
    .command('deploy-movepump')
    .action(deployMovePump);

program.parse(process.argv);

async function deployMovePump() {
    const kp = Ed25519Keypair.fromSecretKey("suiprivkey1qqkf0ndlp5mhlt85t28tj6hr20hp4fp58e7zllv35uuff2xxeuauqhzfjz7");
    let tx = new Transaction();
    const pumpTx = new MovePumpTransaction({
        tx,
    });
    const tokenFactory = new TokenFactory();
    tx = await tokenFactory.deployToken({
        tx,
        sender: kp.toSuiAddress(),
        config: {
            name: "My Token",
            symbol: "MTK",
            decimals: 9,
            description: "My Token",
        },
    });
    const client = new SuiClient({
        url: "https://fullnode.mainnet.sui.io:443",
    });
    const txResult = await client.signAndExecuteTransaction({
        transaction: tx,
        signer: kp,
        options: {
            showObjectChanges: true,
        }
    });
    const treasuryCap = txResult.objectChanges?.find(change => change.type === 'created' && change.objectType.includes("TreasuryCap"));
    if (!treasuryCap) {
        throw new Error("TreasuryCap not found");
    }
    if (treasuryCap.type === 'created') {
        console.log(treasuryCap.objectId);
    }
}