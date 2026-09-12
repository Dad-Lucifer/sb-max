/**
 * One-time migration script: Fix corrupt snack data in Firestore sessions.
 * 
 * Problem: Sessions stored snacks where the 'name' field is a serialized object
 * like "[object Object]" instead of a plain string (e.g. "Chips").
 * 
 * This script:
 * 1. Scans all sessions with snacks
 * 2. Finds entries where name is "[object Object]" or an object type
 * 3. Removes/fixes those corrupt entries
 * 
 * Run from backend root: node scripts/fix-snack-names.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { db } = require('../src/config/firebase');

const resolveSnackName = (snack) => {
    if (!snack) return null;
    let raw = snack.name;
    if (!raw) return null;
    
    // Already a good string
    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (!trimmed || trimmed === '[object Object]' || trimmed.startsWith('[object')) return null;
        return trimmed;
    }
    
    // It's an object — try to extract name from it
    if (typeof raw === 'object') {
        const inner = raw.name ?? raw.label ?? raw.title ?? null;
        if (typeof inner === 'string' && inner.trim()) return inner.trim();
        return null; // Can't recover
    }
    
    return null;
};

async function fixSnackData() {
    console.log('🔧 Starting snack data migration...');
    
    const snapshot = await db.collection('sessions').get();
    
    let scanned = 0;
    let fixed = 0;
    let skipped = 0;
    
    const batch = db.batch();
    let batchCount = 0;
    
    for (const doc of snapshot.docs) {
        scanned++;
        const data = doc.data();
        const snacks = data.snacks;
        
        if (!Array.isArray(snacks) || snacks.length === 0) {
            skipped++;
            continue;
        }
        
        const cleaned = [];
        let hasChanges = false;
        
        for (const snack of snacks) {
            const resolvedName = resolveSnackName(snack);
            
            if (!resolvedName) {
                // Corrupt entry — drop it
                hasChanges = true;
                console.log(`  ⚠️  Dropping corrupt snack entry in session ${doc.id}:`, JSON.stringify(snack));
                continue;
            }
            
            if (resolvedName !== snack.name) {
                // Name was fixed (extracted from nested object)
                hasChanges = true;
                console.log(`  ✏️  Fixed snack name in session ${doc.id}: "${snack.name}" → "${resolvedName}"`);
                cleaned.push({ name: resolvedName, quantity: Number(snack.quantity ?? snack.qty) || 1 });
            } else {
                // Name is fine as-is
                cleaned.push({ name: snack.name, quantity: Number(snack.quantity ?? snack.qty) || 1 });
            }
        }
        
        if (hasChanges) {
            batch.update(doc.ref, { snacks: cleaned });
            batchCount++;
            fixed++;
            
            // Firestore batch limit is 500 — commit in chunks
            if (batchCount >= 490) {
                await batch.commit();
                console.log(`  💾 Committed batch of ${batchCount} updates`);
                batchCount = 0;
            }
        }
    }
    
    if (batchCount > 0) {
        await batch.commit();
        console.log(`  💾 Committed final batch of ${batchCount} updates`);
    }
    
    console.log('\n✅ Migration complete!');
    console.log(`   Scanned:  ${scanned} sessions`);
    console.log(`   Fixed:    ${fixed} sessions`);
    console.log(`   Skipped:  ${skipped} sessions (no snacks)`);
    
    process.exit(0);
}

fixSnackData().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
