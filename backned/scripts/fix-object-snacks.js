/**
 * Fix corrupt snack data stored as { name: "[object Object]" } in Firestore.
 * This handles sessions where the old production backend stored
 * the entire snack object as the name field.
 * 
 * Run from backend root: node scripts/fix-object-snacks.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { db } = require('../src/config/firebase');

async function fixObjectSnacks() {
    console.log('🔧 Fixing [object Object] snack names in Firestore...');

    const snapshot = await db.collection('sessions').get();

    let scanned = 0;
    let fixed = 0;

    for (const doc of snapshot.docs) {
        scanned++;
        const data = doc.data();
        const snacks = data.snacks;

        if (!Array.isArray(snacks) || snacks.length === 0) continue;

        let hasChanges = false;
        const cleaned = snacks
            .map(snack => {
                if (!snack) return null;

                let name = snack.name;
                const qty = Number(snack.quantity ?? snack.qty) || 1;

                // Case 1: name is an object like { id: "chips", name: "Chips", price: 15 }
                if (name && typeof name === 'object') {
                    const extracted = name.name ?? name.label ?? name.title ?? null;
                    if (typeof extracted === 'string' && extracted.trim()) {
                        console.log(`  ✏️  [${doc.id}] Object name → "${extracted.trim()}"`);
                        hasChanges = true;
                        return { name: extracted.trim(), quantity: qty };
                    }
                    console.log(`  ⚠️  [${doc.id}] Dropping unresolvable object snack:`, JSON.stringify(snack));
                    hasChanges = true;
                    return null;
                }

                // Case 2: name is already the string "[object Object]"
                if (typeof name === 'string' && (name.includes('[object') || !name.trim())) {
                    console.log(`  ⚠️  [${doc.id}] Dropping corrupt string snack: "${name}"`);
                    hasChanges = true;
                    return null;
                }

                // Case 3: Good entry
                return { name: String(name).trim(), quantity: qty };
            })
            .filter(Boolean);

        if (hasChanges) {
            await doc.ref.update({ snacks: cleaned });
            fixed++;
            console.log(`  ✅ Fixed session ${doc.id} — snacks now: ${JSON.stringify(cleaned)}`);
        }
    }

    console.log(`\n✅ Done! Scanned ${scanned} sessions, fixed ${fixed}.`);
    process.exit(0);
}

fixObjectSnacks().catch(err => {
    console.error('❌ Failed:', err);
    process.exit(1);
});
