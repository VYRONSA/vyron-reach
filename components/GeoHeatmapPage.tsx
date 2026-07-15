'use client'
import { geoHeatmap } from '@/lib/geoHeatmaps'

export function GeoHeatmapPage(){
 const areas = geoHeatmap()

 return (
  <div className="space-y-4">
   <h1 className="text-5xl font-black text-white">Geo Heatmaps</h1>
   {areas.map(area => (
    <div key={area} className="rounded-2xl bg-[#0b0b1d] p-4 text-white">{area}</div>
   ))}
  </div>
 )
}