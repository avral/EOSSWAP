export function calculatePrice(sell, buy) {
  let first = parseAsset(buy)
  let second = parseAsset(sell)

  if (second.symbol == 'EOS' && sell.contract == 'eosio.token')
    // EOS main token as main in price
    [first, second] = [second, first]
    
  let k = 1 / first.amount
  let first_price = (second.amount * k).toFixed(4)

  return `1 ${first.symbol} / ${first_price} ${second.symbol}`
}

export function parseAsset(asset) {
  if (asset.hasOwnProperty('symbol')) return asset

  let paths = asset.quantity.split(' ')
  return {
    symbol: paths[1],
    contract: asset.contract,
    amount: parseFloat(paths[0]),

    get quantity () {
      // TODO Precision
      return this.amount.toFixed(4) + ' ' + this.symbol
    }
  }
}
