const local = {
  contract: 'ordersbook',

  chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
  host: 'http://localhost:8888',
  port: 8888,
  protocol: 'http',
}

const jungle = {
  contract: 'avralsjungle',

  chainId: 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473',
  host: 'https://jungle2.cryptolions.io',
  port: 80,
  protocol: 'https',
}

const eos_mainet = {
  // TODO Implement mainet

}

export default process.env.isDev ? local : jungle
