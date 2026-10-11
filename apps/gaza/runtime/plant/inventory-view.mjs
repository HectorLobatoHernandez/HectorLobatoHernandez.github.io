/** Read-only visual allocation. Glyphs are a bounded subset, never warehouse capacity. */
export function inventoryGlyphPlan(view,limits={rack:24,dock:12}){
 const empty={rack:0,dock:0,represented:0,stock:0,source:'NO_VALID_STOCK'};
 const stock=view?.pallets?.stored;
 if(!view?.ready||!Number.isSafeInteger(stock)||stock<0)return empty;
 if(!Number.isInteger(limits.rack)||limits.rack<0||!Number.isInteger(limits.dock)||limits.dock<0)return empty;
 const placed=view.tasks?.['WAREHOUSE.PUTAWAY']?.state==='DONE';
 if(!placed)return {...empty,stock,source:'PRODUCT_NOT_PUT_AWAY'};
 const task=view.tasks?.['DISPATCH.LOAD'];
 const staging=['RUNNING','HELD','UNAVAILABLE','WAIT_GATE'].includes(task?.state);
 const fraction=staging&&Number.isFinite(task.progress)?Math.max(0,Math.min(1,task.progress)):0;
 const atDock=Math.floor(stock*fraction),atRack=stock-atDock;
 const rack=Math.min(limits.rack,atRack),dock=Math.min(limits.dock,atDock);
 return {rack,dock,represented:rack+dock,stock,source:'SELECTED_LOT_BOUNDED_VISUAL_SUBSET'};
}
