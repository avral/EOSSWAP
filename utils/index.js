export function calculatePrice(sell, buy) {
  let first = parseAsset(buy)
  let second = parseAsset(sell)

  console.log(first)

  if (second.symbol == 'EOS' && sell.contract == 'eosio.token')
    // EOS main token as main in price
    [first, second] = [second, first]
    
  let k = 1 / first.amount
  let first_price = (second.amount * k).toFixed(4)

  return `1 ${first.symbol} / ${first_price} ${second.symbol}`
}

export function parseAsset(asset) {
  let paths = asset.quantity.split(' ')

  asset.symbol = paths[1]
  asset.amount = parseFloat(paths[0])

  return asset
}
