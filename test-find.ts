import fs from 'fs';
const DATA_FILE = 'app_data.json';
const stores = new Map<string, any>(JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')));

const slug = 'barraca-do-samuel';
const store = Array.from(stores.values()).find(s => s.settings.storeSlug === slug || s.id === slug);

console.log("JSON stores:", stores.size);
console.log("slug:", slug);
console.log("Found store:", store ? store.settings.storeSlug : 'undefined');
