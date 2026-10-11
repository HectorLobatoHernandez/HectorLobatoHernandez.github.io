import './site-real-app-base-v2.mjs';
import {subscribeProcess} from './dairy-process-store.mjs';
// Refresh the existing read-only HUD when the canonical in-page ledger changes.
subscribeProcess(()=>dispatchEvent(new StorageEvent('storage',{key:'gaza:operations-thread:v1'})));
