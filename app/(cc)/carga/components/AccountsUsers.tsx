"use client";
import {useEffect,useState,type FormEvent} from 'react';
import {admin} from '../operations';
type User={id:string;name:string;first_name?:string;last_name?:string;phone?:string;identification?:string;role:string;approved:boolean;fixture:boolean;deleted_at?:string|null;shipments?:number};
type Acceptance={kind:string;document_id:string;version:string;accepted_at:string;document_title?:string;document_content?:string;content_sha256?:string;accepted_name?:string;accepted_phone?:string};
type Detail={account:User;legal:Acceptance[]};
const labels:Record<string,string>={CARGA_TERMS:'Términos y condiciones',CARGA_PRIVACY:'Política de privacidad'};
export default function Users(){
 const [users,setUsers]=useState<User[]>(),[filter,setFilter]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const [access,setAccess]=useState<{id:string;entity_id:string;title:string;body:string;created_at:string}[]>([]);
 async function loadAccess(){try{setAccess(await admin('operations/access'));}catch{}}
 useEffect(()=>{void loadAccess();const timer=setInterval(()=>{if(document.visibilityState==='visible')void loadAccess();},30000);return()=>clearInterval(timer);},[]);
 const [includeDeleted,setIncludeDeleted]=useState(false);
 const [opened,setOpened]=useState(false),[detail,setDetail]=useState<Detail>(),[form,setForm]=useState({firstName:'',lastName:'',phone:'',identification:'',password:''}),[confirm,setConfirm]=useState('');
 async function load(){try{setUsers(await admin('accounts/users'+(includeDeleted?'?includeDeleted=true':'')));}catch(e){setError(e instanceof Error?e.message:'No pudimos consultar las cuentas.');}}
 useEffect(()=>{void load();},[includeDeleted]);
 async function view(user:User){setBusy(true);setError('');setNotice('');try{const data:Detail=await admin('account-management/'+user.id);setDetail(data);setForm({firstName:data.account.first_name??data.account.name.split(' ')[0]??'',lastName:data.account.last_name??data.account.name.split(' ').slice(1).join(' '),phone:data.account.phone??'',identification:data.account.identification??'',password:''});setConfirm('');setOpened(true);}catch(e){setError(e instanceof Error?e.message:'No pudimos abrir la cuenta.');}finally{setBusy(false);}}
 function create(){setDetail(undefined);setForm({firstName:'',lastName:'',phone:'',identification:'',password:''});setConfirm('');setError('');setNotice('');setOpened(true);}
 async function save(event:FormEvent){event.preventDefault();setBusy(true);setError('');try{const data=await admin('account-management'+(detail?'/'+detail.account.id:''),{...form,...(!form.password?{password:undefined}:{})});setDetail(data);setForm(current=>({...current,password:''}));setNotice('Cuenta guardada.');await load();}catch(e){setError(e instanceof Error?e.message:'No pudimos guardar la cuenta.');}finally{setBusy(false);}}
 async function remove(){if(!detail)return;setBusy(true);setError('');try{await admin('account-management/'+detail.account.id+'/delete',{confirm});setOpened(false);setDetail(undefined);setNotice('Cuenta eliminada. Se conserva el registro histórico de aceptación legal.');await load();}catch(e){setError(e instanceof Error?e.message:'No pudimos eliminar la cuenta.');}finally{setBusy(false);}}
 const field=(key:keyof typeof form,label:string,type='text')=><label>{label}<input type={type} value={form[key]} disabled={busy||detail?.account.fixture||!!detail?.account.deleted_at} onChange={event=>setForm(current=>({...current,[key]:event.target.value}))} required={['firstName','lastName','phone'].includes(key)} maxLength={key==='phone'?10:key==='password'?128:60} minLength={key==='password'&&form.password?8:undefined} autoComplete={key==='password'?'new-password':'off'}/></label>;
 return <section className="carga-account-view">
  {access.length>0&&<section style={{background:'#fff5e5',padding:14,borderRadius:12}}><h2>Cambios de acceso por revisar · {access.length}</h2>{access.map(event=><article key={event.id}><div><strong>{event.title}</strong><p>{event.body}</p><p>{new Date(event.created_at).toLocaleString('es-CO')}</p></div><div className="carga-actions"><button onClick={()=>{const user=users?.find(u=>u.id===event.entity_id);if(user)void view(user);}}>Ver cuenta</button><button onClick={()=>{void admin('operations/access/'+event.id+'/acknowledge',{}).then(()=>{void loadAccess();window.dispatchEvent(new Event('kronix:carga-refresh'));}).catch(e=>setError(e.message));}}>Marcar revisado</button></div></article>)}</section>}
  <div className="carga-actions"><button onClick={create} disabled={busy}>Crear usuario</button><button onClick={()=>void load()} disabled={busy}>Actualizar</button></div>
  <label style={{display:"flex",gap:8,alignItems:"center"}}><input type="checkbox" checked={includeDeleted} onChange={event=>setIncludeDeleted(event.target.checked)}/> Incluir cuentas eliminadas para consultar su historial legal</label>
  <label>Buscar por nombre o celular<input value={filter} onChange={event=>setFilter(event.target.value)}/></label>
  {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
  {opened&&<section style={{background:'white',border:'1px solid #d4e1ef',borderRadius:14,padding:16,marginBlock:12}}>
   <h2>{detail?.account.deleted_at?'Historial de cuenta eliminada':detail?'Ver / editar usuario':'Crear usuario'}</h2>
   <form onSubmit={event=>void save(event)}>
    {field('firstName','Nombre')}{field('lastName','Apellido')}{field('phone','Celular','tel')}{field('identification','Identificación')}
    {field('password',detail?'Nueva contraseña · dejar vacía para conservar':'Contraseña · si queda vacía se usará el celular','password')}
    {!detail?.account.fixture&&!detail?.account.deleted_at&&<button type="button" disabled={busy||form.phone.length!==10} onClick={()=>setForm(current=>({...current,password:current.phone}))}>Usar celular como contraseña</button>}
    <p>La contraseña actual no se puede consultar. Al restablecerla o cambiar el celular se cierran las sesiones de esa cuenta.</p>
    <button disabled={busy||detail?.account.fixture||!!detail?.account.deleted_at}>{busy?'Guardando…':detail?'Guardar cambios':'Crear cuenta'}</button>
    <button type="button" onClick={()=>setOpened(false)} disabled={busy}>Cerrar ficha</button>
   </form>
   {detail&&<section><h3>Aceptación legal</h3>
    {!detail.legal.length&&<p>Sin aceptaciones registradas. El usuario deberá aceptar los documentos vigentes desde la app; esta ficha no acepta documentos en su nombre.</p>}
    {detail.legal.map(record=><article key={record.kind+record.document_id} style={{display:'block'}}>
     <strong>{record.document_title||labels[record.kind]||record.kind}</strong><p>Versión {record.version} · {new Date(record.accepted_at).toLocaleString('es-CO',{timeZone:'America/Bogota'})} (Colombia)</p>
     <p>Documento: <code>{record.document_id}</code></p><p>Nombre al aceptar: {record.accepted_name??'No capturado en el registro original'} · Celular: {record.accepted_phone??'No capturado'}</p>
     {record.content_sha256&&<p style={{overflowWrap:'anywhere'}}>Huella SHA-256: <code>{record.content_sha256}</code></p>}
     {record.document_content?<details><summary>Ver texto aceptado</summary><pre style={{whiteSpace:'pre-wrap',fontFamily:'inherit'}}>{record.document_content}</pre></details>:<p>Registro anterior a la captura del texto: se conservan su fecha, versión e identificador originales.</p>}
    </article>)}
   </section>}
   {detail&&!detail.account.fixture&&!detail.account.deleted_at&&<section><h3>Eliminar cuenta</h3><p>Las reservas activas deben finalizarse antes de eliminarla.</p><label>Escribe ELIMINAR<input value={confirm} onChange={event=>setConfirm(event.target.value)}/></label><button disabled={busy||confirm!=='ELIMINAR'} onClick={()=>void remove()}>Eliminar cuenta</button></section>}
  </section>}
  {!users&&!error&&<p>Cargando cuentas…</p>}
  {users?.filter(user=>(user.name+' '+(user.phone??'')).toLowerCase().includes(filter.trim().toLowerCase())).map(user=><article key={user.id}><div><strong>{user.name}</strong><p>{user.phone??'Sin celular'} · {user.shipments} envíos</p></div><div className="carga-actions"><span className="carga-status">{user.deleted_at?'Cuenta eliminada · Historial legal':user.role==='carrier'?'Usuario y transportador':'Usuario'}{user.fixture?' · Revisión':''}</span><button disabled={busy} onClick={()=>void view(user)}>{user.deleted_at?"Ver historial legal":"Ver / editar usuario"}</button></div></article>)}
 </section>;
}
