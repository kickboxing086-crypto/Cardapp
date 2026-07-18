import fs from 'fs';
const DATA_FILE = 'app_data.json';
const fileData = fs.readFileSync(DATA_FILE, 'utf-8');
const parsed = JSON.parse(fileData);
const stores = new Map<string, any>(parsed);

console.log(stores.keys());
const slugToFind = 'barraca-do-samuel';
const store = Array.from(stores.values()).find(s => s.settings.storeSlug === slugToFind || s.id === slugToFind);

console.log("Found:", store !== undefined);
if (store) console.log(store.settings);
