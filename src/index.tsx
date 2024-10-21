import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Button, Frog, parseEther } from 'frog'
import { devtools } from 'frog/dev'
import { pinata } from 'frog/hubs'
import { base, baseSepolia } from 'viem/chains'
import { abi } from './contract/abi.js'
import _config_ from './config'
import { createPublicClient, http } from 'viem'

export const app = new Frog({
  title: 'Farcaster Group Buy',
  hub: pinata(),
  verify: false,
})

app.use('/*', serveStatic({ root: './public' }))

const contractAddr = _config_.contractAddr
const ticketPrice = _config_.ticketPrice

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
})

app.frame('/', async (c) => {
  const { buttonValue, buttonIndex, status, frameData, verified } = c

  console.log('verified', verified)
  console.log(frameData)

  const { fid } = frameData || {}
  console.log('fid', fid)

  return c.res({
    image: (
      <div
        style={{
          alignItems: 'center',
          background:
            status === 'response'
              ? 'linear-gradient(to right, #432889, #17101F)'
              : 'black',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          Hello! You may need to visit our site to setup your promotion.
        </div>
      </div>
    ),
    intents: [
      <Button.Link href={_config_.mainAppUrl}>Go to our website</Button.Link>,
    ],
  })
})

app.frame('/cast/:couponId', async (c) => {
  const { status, frameData } = c

  const couponId = c.req.param('couponId')
  const coupon = await fetch(_config_.mainAppUrl + '/api/coupons/' + couponId)
                            .then(res => res.json())
  console.log(coupon)

  return c.res({
    image: (
      <div
        style={{
          alignItems: 'center',
          background:
            status === 'response'
              ? 'linear-gradient(to right, #432889, #17101F)'
              : 'black',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <img src={coupon.imageUrl} style={{height: '100%'}} />
      </div>
    ),
    intents: [
      <Button action={`/stats/${couponId}`}>Stats</Button>,
      <Button.Transaction target={`/join/${couponId}`}>Join Now!</Button.Transaction>,
    ],
  })
})


app.frame('/stats/:couponId', async (c) => {
  const { status, frameData } = c

  // console.log('contex: ', c)

  const userWalletAddress = frameData?.address

  const couponId = c.req.param('couponId')
  const coupon = await fetch(_config_.mainAppUrl + '/api/coupons/' + couponId)
                            .then(res => res.json())
  // console.log(coupon)

  const tickets = await publicClient.readContract({
    address: contractAddr,
    abi: abi,
    functionName: 'getTicketsByCouponID',
    args: [parseInt(couponId)]
  })

  let ownTickets
  if (userWalletAddress) {
    ownTickets = await publicClient.readContract({
      address: contractAddr,
      abi: abi,
      functionName: 'getBuyerTickets',
      args: [parseInt(couponId), `0x${userWalletAddress}`]
    })
  }

  return c.res({
    image: (
      <div
        style={{
          alignItems: 'center',
          background:
            status === 'response'
              ? 'linear-gradient(to right, #432889, #17101F)'
              : 'black',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
            color: 'white',
            fontSize: 40,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex' }}>
              <div style={{ display: 'flex', fontWeight: 'bold' }}>Coupon ID:</div>
              <div style={{ display: 'flex' }}>{coupon.id}</div>
            </div>
            <div style={{ display: 'flex' }}>
              <div style={{ display: 'flex', fontWeight: 'bold' }}>Number of Winners:</div>
              <div style={{ display: 'flex' }}>{coupon.numOfWinners}</div>
            </div>
            <div style={{ display: 'flex' }}>
              <div style={{ display: 'flex', fontWeight: 'bold' }}>Max Tickets:</div>
              <div style={{ display: 'flex' }}>{coupon.maxNumOfTickets}</div>
            </div>
            <div style={{ display: 'flex' }}>
              <div style={{ display: 'flex', fontWeight: 'bold' }}>Min Tickets Requirement:</div>
              <div style={{ display: 'flex' }}>{coupon.minNumOfTickets} {tickets.length >= coupon.minNumOfTickets ? ' achieved' : ' not achieved'}</div>
            </div>
          </div>
        </div>
      </div>
    ),
    intents: [
      <Button action={`/cast/${couponId}`}>Back to Main</Button>,
      <Button.Transaction target={`/join/${couponId}`}>Join Now!</Button.Transaction>,
    ],
  })
})

app.frame('/finish', (c) => {
  const { transactionId } = c
  console.log('transactionId', transactionId)

  return c.res({
    image: (
      <div
      style={{
        alignItems: 'center',
        background: 'black',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
      }}>
        <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
          Transaction ID: {transactionId}
        </div>
      </div>
    )
  })
})

app.transaction('/join/:couponId', (c) => {
  const couponId = c.req.param('couponId')

  return c.contract({
    abi,
    functionName: 'createTicket',
    args: [parseInt(couponId)],
    chainId: `eip155:${baseSepolia.id}`,
    to: contractAddr,
    value: parseEther(ticketPrice),
  })
})

devtools(app, { serveStatic })
