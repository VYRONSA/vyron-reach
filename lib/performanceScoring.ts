export function generatePerformanceScore(score:number){
  if(score >= 80) return 'Excellent'
  if(score >= 60) return 'Good'
  if(score >= 40) return 'Average'
  return 'Poor'
}