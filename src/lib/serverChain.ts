import 'server-only'
import { JsonRpcProvider, Wallet } from 'ethers'

// `server-only` above makes Next.js throw a build error if anything client-side
// ever imports this file — the private key must never reach a browser bundle.

const RPC_URL = process.env.RPC_URL
const PRIVATE_KEY = process.env.FAUCET_PRIVATE_KEY

if (!RPC_URL) throw new Error('RPC_URL is not set — see .env.example')
if (!PRIVATE_KEY) throw new Error('FAUCET_PRIVATE_KEY is not set — see .env.example')

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 76081)

export const serverProvider = new JsonRpcProvider(RPC_URL, {
	chainId: CHAIN_ID,
	name: process.env.NEXT_PUBLIC_CHAIN_NAME ?? 'SysFi Testnet',
})

export const faucetWallet = new Wallet(PRIVATE_KEY, serverProvider)

/**
 * Local nonce tracking rather than trusting the node's "pending" count on
 * every send: initialized once from the chain, then incremented in-process
 * after each successful broadcast. Combined with `withNonceLock` below, this
 * is what keeps two concurrent claims from racing for the same nonce.
 */
let nextNoncePromise: Promise<number> | null = null
async function getNextNonce(): Promise<number> {
	if (nextNoncePromise === null) {
		nextNoncePromise = serverProvider.getTransactionCount(faucetWallet.address, 'pending')
	}
	return nextNoncePromise
}

let queue: Promise<unknown> = Promise.resolve()

/**
 * Serializes every send through the faucet wallet. Each call waits for the
 * previous one to finish determining (and locally advancing) the nonce
 * before it starts — the actual broadcast/confirmation can still happen
 * concurrently, only the nonce bookkeeping is serialized.
 */
export function withNonceLock<T>(fn: (nonce: number) => Promise<T>): Promise<T> {
	const run = queue.then(async () => {
		const nonce = await getNextNonce()
		try {
			const result = await fn(nonce)
			nextNoncePromise = Promise.resolve(nonce + 1)
			return result
		} catch (err) {
			// Nonce wasn't consumed (send failed before broadcast) — don't advance it.
			nextNoncePromise = Promise.resolve(nonce)
			throw err
		}
	})
	// Keep the queue alive even if this particular call rejects.
	queue = run.catch(() => undefined)
	return run
}
