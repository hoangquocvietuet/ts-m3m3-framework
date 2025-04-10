import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";

import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient } from "@mysten/sui/client";

export type TokenConfig = {
    name: string;
    symbol: string;
    decimals: number;
    description: string;
    iconUrl?: string;
}

export type DeployTokenParams = {
    config: TokenConfig;
    sender: string;
    tx: Transaction;
}

export class TokenFactory {
    private readonly tempDir: string;

    constructor() {
        this.tempDir = path.join(__dirname, 'temp_contracts');
    }

    private async generateMoveToml(moduleName: string): Promise<string> {
        return `
            [package]
            name = "${moduleName}"
            version = "0.0.1"

            [dependencies]
            Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "testnet" }

            [addresses]
            ${moduleName} = "0x0"`;
    }

    private async generateTokenModule(config: TokenConfig, moduleName: string): Promise<string> {
        return `
            #[allow(unused_use)]
            module ${moduleName}::${config.symbol.toLowerCase()} {
                use std::option;
                use sui::coin::{Self, TreasuryCap, CoinMetadata};
                use sui::transfer;
                use sui::tx_context::{Self, TxContext};
                use sui::url;

                struct ${config.symbol.toUpperCase()} has drop {}

                fun init(witness: ${config.symbol.toUpperCase()}, ctx: &mut TxContext) {
                    let (treasury_cap, metadata) = coin::create_currency<${config.symbol.toUpperCase()}>(
                        witness, 
                        ${config.decimals},
                        b"${config.symbol}",
                        b"${config.name}",
                        b"${config.description}",
                        ${config.iconUrl ? `option::some(url::new_unsafe_from_bytes(b"${config.iconUrl}"))` : 'option::none()'},
                        ctx
                    );
                    transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
                    transfer::public_share_object(metadata);
                }
            }`;
    }

    private async setupTempDir(dirPath: string): Promise<void> {
        await fs.mkdir(dirPath, { recursive: true });
        await fs.mkdir(path.join(dirPath, 'sources'), { recursive: true });
    }

    private async cleanupTempDir(dirPath: string): Promise<void> {
        await fs.rm(dirPath, { recursive: true, force: true });
    }

    public async deployToken(params: DeployTokenParams) {
        const { config, sender } = params;
        const tx = params.tx || new Transaction();
        try {
            const moduleName = `token_${config.symbol.toLowerCase()}`;
            const contractDir = path.join(this.tempDir, moduleName);

            // Setup directory
            await this.setupTempDir(contractDir);

            // Generate and write files
            const moveToml = await this.generateMoveToml(moduleName);
            const moduleContent = await this.generateTokenModule(config, moduleName);

            await fs.writeFile(path.join(contractDir, 'Move.toml'), moveToml);
            await fs.writeFile(
                path.join(contractDir, 'sources', 'token.move'),
                moduleContent
            );

            // Build the package
            execSync('sui move build', { cwd: contractDir });

            // Read the compiled package
            const compiledBytes = await fs.readFile(
                path.join(contractDir, 'build', moduleName, 'bytecode_modules', `${config.symbol.toLowerCase()}.mv`)
            );


            const [upgradeCap] = tx.publish({
                modules: [Array.from(compiledBytes)],
                dependencies: ["0x1", "0x2"],
            });
            tx.transferObjects([upgradeCap], sender);
            await this.cleanupTempDir(contractDir);
            
            return tx;
        } catch (error) {
            console.error('Error deploying token:', error);
            throw error;
        }
    }
}