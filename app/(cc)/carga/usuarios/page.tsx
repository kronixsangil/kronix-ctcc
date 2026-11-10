"use client";
import { useEffect,useState } from "react";
import { admin } from "../operations";
type User={id:string;name:string;phone?:string;role:string;approved:boolean;fixture:boolean;shipments:number};
export default function Users() {
  const [users,setUsers]=useState<User[]>();
  const [filter,setFilter]=useState("");
  const [error,setError]=useState("");
  useEffect(()=>{void admin("accounts/users").then(setUsers).catch(failure=>setError(failure.message));},[]);
  return <main>
    <header><p>Carga KroniX</p><h1>Usuarios de Carga</h1><p>Consulta las cuentas y sus envíos.</p></header>
    <label>Buscar por nombre o celular<input value={filter} onChange={event=>setFilter(event.target.value)} /></label>
    {error && <p role="alert">{error}</p>}
    {!users && !error && <p>Cargando cuentas…</p>}
    {users?.filter(user=>(user.name+" "+(user.phone??"")).toLowerCase().includes(filter.trim().toLowerCase())).map(user=>
      <article key={user.id}><div><strong>{user.name}</strong><p>{user.phone??"Sin celular"} · {user.shipments} envíos</p></div>
        <span className="carga-status">{user.role==="carrier" ? "Usuario y transportador" : "Usuario"}{user.fixture ? " · Revisión" : ""}</span></article>)}
  </main>;
}
