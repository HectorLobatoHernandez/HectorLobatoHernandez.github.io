// Explicitly hypothetical production-aggregation contract. No internal GAZA data.
export const networkModel=Object.freeze({
 schemaVersion:1,
 provenance:'SIMULATED',
 method:'SCENARIO_AGGREGATION_NOT_REPORTED_PRODUCTION',
 canonicalNode:'ZAMORA_MASTER_FARM',
 sourceNetworkLabel:'80+ ganaderías: referencia pública contextual, no censo operativo',
 // Values are editable TRAINING INPUTS; intentionally no fictional GAZA output total.
 assumedFarms:null,litresPerFarmPerDay:null,computedLitresPerDay:null,
 plantNode:'COResES_PLANT',
 laboratoryNode:'COResES_QUALITY_LAB',
 evidence:'Actual yields, counts per farm, routes and site throughput require GAZA authorization.'
});
export function scenarioVolume({farms,litresPerFarmPerDay}){
 const a=Number(farms),b=Number(litresPerFarmPerDay);
 if(!Number.isInteger(a)||a<=0||a>10000||!Number.isFinite(b)||b<0||b>100000)return null;
 return {provenance:'SIMULATED',farms:a,litresPerFarmPerDay:b,totalLitresPerDay:a*b};
}
export const journey=[
 {id:'farm',label:'Granja maestra virtual',kind:'SIMULATED'},
 {id:'tanker',label:'Transporte cisterna',kind:'SIMULATED'},
 {id:'receiving',label:'Recepción planta',kind:'SIMULATED'},
 {id:'laboratory',label:'Laboratorio de calidad',kind:'SIMULATED'},
 {id:'production',label:'Producción y envasado',kind:'SIMULATED'},
 {id:'warehouse',label:'ASRS y expedición',kind:'SIMULATED'}
];