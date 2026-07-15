export function profitability(spend:number,revenue:number){
  return {
    spend,
    revenue,
    profit: revenue - spend,
    roi: spend === 0 ? 0 : ((revenue-spend)/spend)*100
  }
}