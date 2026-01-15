import CoinbaseWalletSDK from "@coinbase/wallet-sdk";
import axios from "axios";
import fs from "node:fs";
import { createPublicClient, createWalletClient, custom, formatEther, http, isAddress } from "viem";
import { baseSepolia } from "viem/chains";

const NETWORK = {
  name: "Base Sepolia",
  chainId: 84532,
  rpc: "https://sepolia.base.org",
  explorer: "https://sepolia.basescan.org",
};

const linkAddress = (a) => `${NETWORK.explorer}/address/${a}`;
const linkCode = (a) => `${NETWORK.explorer}/address/${a}#code`;
const linkBlock = (b) => `${NETWORK.explorer}/block/${b}`;
const short = (a) => `${a.slice(0, 6)}...${a.slice(-4)}`;

function loadTargets() {
  try {
    return JSON.parse(fs.readFileSync("inputs/targets.json", "utf8")).targets ?? [];
  } catch {
    return [];
  }
}

async function rpcProbe() {
  const payload = { jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] };
  const res = await axios.post(NETWORK.rpc, payload, { timeout: 9000 });
  return res?.data?.result ?? null;
}

export async function run() {
  console.log("Built for Base");
  console.log(`network: ${NETWORK.name}`);
  console.log(`chainId: ${NETWORK.chainId}`);
  console.log(`explorer: ${NETWORK.explorer}`);
  console.log("");

  console.log("rpc probe:");
  try {
    console.log(`- eth_chainId: ${await rpcProbe()}`);
  } catch {
    console.log("- rpc unavailable");
  }
  console.log("");

  const sdk = new CoinbaseWalletSDK({ appName: "Polar Vector Matrix" });
  const provider = sdk.makeWeb3Provider(NETWORK.rpc, NETWORK.chainId);

  const walletClient = createWalletClient({
    chain: baseSepolia,
    transport: custom(provider),
  });

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(NETWORK.rpc),
  });

  let addresses = [];
  try {
    addresses = await walletClient.getAddresses();
  } catch {}

  if (addresses.length) {
    console.log("wallet balances:");
    for (const a of addresses) {
      const bal = await publicClient.getBalance({ address: a });
      console.log(`- ${short(a)}: ${formatEther(bal)} ETH`);
      console.log(`  ${linkAddress(a)}`);
    }
    console.log("");
  }

  const blockNum = await publicClient.getBlockNumber();
  const block = await publicClient.getBlock({ blockNumber: blockNum });
  const gas = await publicClient.getGasPrice();

  console.log("chain metrics:");
  console.log(`- block: ${blockNum.toString()}`);
  console.log(`  ${linkBlock(blockNum.toString())}`);
  console.log(`- timestamp: ${new Date(Number(block.timestamp) * 1000).toISOString()}`);
  console.log(`- gas gwei: ${(Number(gas) / 1e9).toFixed(3)}`);
  console.log("");

  console.log("bytecode matrix:");
  for (const t of loadTargets()) {
    if (!isAddress(t)) continue;
    const code = await publicClient.getBytecode({ address: t });
    console.log(`- ${short(t)}: ${code && code !== "0x" ? "present" : "empty"}`);
    console.log(`  ${linkCode(t)}`);
  }
}

run().catch(console.error);
