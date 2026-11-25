// Los importes llegan como texto para conservar todos sus dígitos.
export function money(value?:string|number){
 const raw=String(value??'0'),parts=raw.split('.');
 if(!/^\d+$/.test(parts[0])||(parts[1]&&!/^0+$/.test(parts[1])))return 'COP —';
 const digits=parts[0].replace(/^0+(?=\d)/,'');
 return 'COP '+digits.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
}
