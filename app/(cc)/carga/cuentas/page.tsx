"use client";
import {useState} from 'react';
import Fleet from '../components/AccountsFleet';
import Users from '../components/AccountsUsers';
export default function Accounts(){const [tab,setTab]=useState('carriers');return <main><header className="carga-titlebar"><div><p>Carga KroniX</p><h1>Cuentas y Vehículos</h1><p>Una sola revisión para el transportador y sus vehículos.</p></div><div className="carga-actions">{[['carriers','Transportadores'],['users','Usuarios']].map(([value,label])=><button key={value} aria-pressed={tab===value} onClick={()=>setTab(value)} style={{background:tab===value?'#0f172a':'#e2e8f0',color:tab===value?'white':'#0f172a'}}>{label}</button>)}</div></header><div hidden={tab!=='carriers'}><Fleet/></div><div hidden={tab!=='users'}><Users/></div></main>;}
