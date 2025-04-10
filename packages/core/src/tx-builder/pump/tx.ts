import { Transaction } from "@mysten/sui/transactions";

export type PumpTransactionParams = {
  tx?: Transaction;
}

export type DeployParams = {
    name: string;
    ticker: string;
    description: string;
    logoUrl: string;
    twitterUrl: string;
    telegramUrl: string;
    websiteUrl: string;
    sender: string;
    treasuryCap: string;
    firstBuyAmount: number;
}

export abstract class PumpTransaction {
  tx: Transaction;

  constructor(params: PumpTransactionParams) {
    this.tx = params.tx || new Transaction();
  }

  abstract deploy(params: DeployParams): Promise<PumpTransaction>;
}
