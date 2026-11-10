export type Route = {
  id:string; stops:string[]; travel_date:string; available_until?:string; destinations?:string[]; load_mode?:string;
  active:boolean; expired:boolean; cancelled_at?:string; in_transit:boolean; has_requests:boolean;
  carrier_id?:string; carrier_name?:string; vehicle_id?:string; plate?:string; vehicle_type:string; description:string;
  loading_start?:string; loading_end?:string; weight_kg:string; floor_m2:string; intermediate_pickup:boolean;
};
export async function admin(path:string,body?:object) {
  const response = await fetch("/api/ctcc/admin/carga-kronix/"+path,{
    cache:"no-store", ...(body ? {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)} : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "No se pudo completar la operación.");
  return data;
}
