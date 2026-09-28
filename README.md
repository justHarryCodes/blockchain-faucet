# SysFi Faucet

A testnet faucet for the SysFi network. Developers connect a wallet or paste an address and receive test **SYN** tokens, limited to one claim per wallet every 24 hours.

## Features

- **One-click claims:** connect a browser wallet or paste an address.
- **Abuse protection:** a 24-hour cooldown per wallet address and per IP address. IPs are stored only as salted hashes, never in plain text.
- **Live status:** the faucet balance, the claim amount and a countdown to the next allowed claim.
- **Network setup:** adds the SysFi testnet to the user's wallet automatically.
- **Social gate:** asks users to follow [@sysfidao](https://x.com/sysfidao) before claiming. This isn't verified.
- **Light and dark themes.**

## Tech stack

- [Next.js](https://nextjs.org) (App Router) with React and TypeScript
- [ethers](https://docs.ethers.org) for signing and sending the faucet transfers
- `node:sqlite` for claim history. It's built into Node.js, so there's no native module to compile.
- Tailwind CSS and lucide-react icons

## Getting started

**Requirements:** Node.js 22.18 or later, which is needed for `node:sqlite`.

```bash
git clone https://github.com/justHarryCodes/blockchain-faucet.git
cd blockchain-faucet
npm install
```

Create a `.env.local` file (see [Environment variables](#environment-variables)), then run:

```bash
npm run dev      # http://localhost:3000
npm run build && npm start   # production
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `FAUCET_PRIVATE_KEY` | ✅ | Private key of the wallet that funds claims. **Server-only. Never commit it.** |
| `RPC_URL` | ✅ | The RPC endpoint the server uses to send transfers. |
| `IP_HASH_SALT` | ✅ | A random secret used to hash client IPs. |
| `DATABASE_PATH` | | Path to the SQLite file. Default `./data/faucet.db`. |
| `NEXT_PUBLIC_CHAIN_ID` | | Chain ID. Default `76081`. |
| `NEXT_PUBLIC_CHAIN_ID_HEX` | | The chain ID in hex, used when adding the network to a wallet. |
| `NEXT_PUBLIC_CHAIN_NAME` | | Network name shown in the UI and wallet. |
| `NEXT_PUBLIC_RPC_URL` | | The public RPC added to users' wallets. |
| `NEXT_PUBLIC_CURRENCY_SYMBOL` | | Native token symbol. Default `SYN`. |
| `NEXT_PUBLIC_CLAIM_AMOUNT` | | Tokens sent per claim. |
| `NEXT_PUBLIC_EXPLORER_URL` | | Block explorer base URL, used for transaction links. |

## How it works

1. The client calls `POST /api/claim` with the recipient address.
2. The server checks the 24-hour cooldown for both the address and the hashed IP in SQLite.
3. If the claim is allowed, the server signs and sends the transfer from the faucet wallet, records it, and returns the transaction hash.
4. `GET /api/status` reports the faucet balance and the caller's remaining cooldown.

## Project structure

```
src/
├── app/
│   ├── api/claim/route.ts    # Sends tokens, enforces cooldowns
│   ├── api/status/route.ts   # Faucet balance + cooldown status
│   ├── layout.tsx
│   └── page.tsx
├── components/               # FaucetCard, SocialGate, ThemeToggle
└── lib/                      # Chain config, SQLite store, wallet helpers
```

## Deployment

The faucet runs on any Node.js 22.18+ host with a persistent disk for the SQLite file, such as a VPS, Railway or Render. Serverless platforms with read-only file systems need `DATABASE_PATH` pointed at a writable volume.
