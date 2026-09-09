import { formatEther } from 'ethers'
import { totalClaims } from '@/lib/db'
import { faucetWallet, serverProvider } from '@/lib/serverChain'

export async function GET() {
	try {
		const balance = await serverProvider.getBalance(faucetWallet.address)
		return Response.json({
			balance: formatEther(balance),
			totalClaims: totalClaims(),
		})
	} catch (err) {
		console.error('[faucet status failed]', err)
		return Response.json({ error: 'Failed to load faucet status' }, { status: 502 })
	}
}
