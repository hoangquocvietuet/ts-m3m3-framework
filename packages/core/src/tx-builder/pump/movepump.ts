import { coinWithBalance } from "@mysten/sui/transactions";
import { DeployParams, PumpTransaction, PumpTransactionParams } from "./tx";

const MOVE_PUMP_PACKAGE_ID = "0x638928d4cf7dd20a598e9d30d3626d61d94ffabee29bc7b861bef67d32110bb4";
const MOVE_PUMP_CONFIG = "0xd746495d04a6119987c2b9334c5fefd7d8cff52a8a02a3ea4e3995b9a041ace4";
const MOVE_PUMP_DEX_INFO = "0x3f2d9f724f4a1ce5e71676448dc452be9a6243dac9c5b975a588c8c867066e92";

export class MovePumpTransaction extends PumpTransaction {
  constructor(params: PumpTransactionParams) {
    super(params);
  }

  async deploy(params: DeployParams): Promise<PumpTransaction> {
    // check ticker is valid: only uppercase letters, length max 5
    if (!/^[A-Z]+$/.test(params.ticker) || params.ticker.length > 5) {
      throw new Error("Invalid ticker");
    }
    const coin = coinWithBalance({
      balance: params.firstBuyAmount,
    });
    this.tx.moveCall({
      package: MOVE_PUMP_PACKAGE_ID,
      module: "move_pump",
      function: "create_and_first_buy",
      arguments: [
        this.tx.object(MOVE_PUMP_CONFIG), 
        this.tx.object(params.treasuryCap),
        this.tx.object(MOVE_PUMP_DEX_INFO),
        coin,
        this.tx.pure.u64(params.firstBuyAmount),
        this.tx.object.clock(),
        this.tx.pure.string(params.name),
        this.tx.pure.string(params.ticker),
        this.tx.pure.string(params.description),
        this.tx.pure.string(params.logoUrl),
        this.tx.pure.string(params.twitterUrl),
        this.tx.pure.string(params.telegramUrl),
        this.tx.pure.string(params.websiteUrl),
      ],
    });
    this.tx.setSender(params.sender);
    this.tx.setGasBudget(1000000000);

    return this;
  }
}