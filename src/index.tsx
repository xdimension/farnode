import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Button, Frog, parseEther } from 'frog'
import { devtools } from 'frog/dev'
// import { neynar } from 'frog/hubs'
import { pinata } from 'frog/hubs'
import {baseSepolia} from 'viem/chains'
import { abi } from './contract/abi.js'

export const app = new Frog({
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
  title: 'Frog Frame',
  hub: pinata(),
  verify: true,
})

app.use('/*', serveStatic({ root: './public' }))

const contractAddr = '0x9Ff3f90C4c1668D5592e27Eef1A403Fad2000E52'
const ticketPrice = '0.0001'

app.frame('/', (c) => {
  const { buttonValue, buttonIndex, status, frameData, verified } = c

  console.log('verified', verified)
  console.log(frameData)

  const { fid } = frameData || {}
  console.log('fid', fid)

  return c.res({
    action: '/finish',
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
          {status === 'response'
            ? 'Thank you for joining'
            : 'Hello'}
        </div>
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            color: 'white',
            fontSize: 30,
            fontStyle: 'normal',
            padding: '0'
          }}>
           <p>Btn Value: {buttonValue}</p>
           <p>Btn Index: {buttonIndex}</p>
        </div>
      </div>
    ),
    intents: [
      <Button.Transaction target="/join">Join Now!</Button.Transaction>,
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

app.transaction('/join', (c) => {
  return c.contract({
    abi,
    functionName: 'enter',
    args: [],
    chainId: `eip155:${baseSepolia.id}`,
    to: contractAddr,
    value: parseEther(ticketPrice),
  })
})

const port = 3000
console.log(`Server is running on port ${port}`)

devtools(app, { serveStatic })

serve({
  fetch: app.fetch,
  port,
})
