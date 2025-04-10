import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { MovePumpTransaction, TokenFactory } from 'meme-framework/core';
import { Command } from 'commander';
import { SuiClient } from '@mysten/sui/client';

const program = new Command();

program.name("meme-framework").version("0.0.1");

program
    .command('deploy-movepump')

program.parse(process.argv);