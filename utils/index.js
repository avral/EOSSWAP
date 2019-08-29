export function calculatePrice(sell, buy) {
  let first = parseAsset(buy)
  let second = parseAsset(sell)

  if (second.symbol == 'EOS' && sell.contract == 'eosio.token')
    // EOS main token as main in price
    [first, second] = [second, first]


  let price = (first.amount / second.amount).toFixed(8)

  return `${price} ${first.symbol}`
}

export function parseAsset(asset) {
  if (asset.hasOwnProperty('symbol')) return asset

  let paths = asset.quantity.split(' ')
  return {
    symbol: paths[1],
    contract: asset.contract,
    amount: parseFloat(paths[0]),

    get str() {
      return `${this.symbol}@${this.contract}`
    },

    get quantity () {
      // TODO Precision
      return this.amount.toFixed(4) + ' ' + this.symbol
    }
  }
}
