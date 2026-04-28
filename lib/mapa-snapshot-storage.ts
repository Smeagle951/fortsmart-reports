/** Bucket Supabase onde o app envia GeoJSON grandes (URLs assinadas; sem passar corpo pela Vercel). */
export function mapaSnapshotBucketName(): string {
  const b = process.env.SUPABASE_MAP_SNAPSHOT_BUCKET?.trim();
  return b?.length ? b : 'mapa-talhoes-geojson';
}
