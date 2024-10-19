import { config } from "dotenv"
config()

export default {
  mainAppUrl: process.env.MAIN_APP_URL,
  contractAddr: process.env.CONTRACT_ADDR,
  ticketPrice: '0.0001'
}