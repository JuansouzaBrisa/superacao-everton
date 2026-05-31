import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup, mergeDocuments, flatten, join } from '@gltf-transform/functions';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

async function lerGLB(nome) {
    const buf = readFileSync(resolve(__dirname, nome));
    return await io.readBinary(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
}

console.log('Lendo arquivos...');
const docIdle     = await lerGLB('SadI-dle.glb');
const docCrying   = await lerGLB('Crying.glb');
const docCapoeira = await lerGLB('Capoeira.glb');

// Renomeia animações para nomes limpos
for (const a of docIdle.getRoot().listAnimations())     a.setName('Idle');
for (const a of docCrying.getRoot().listAnimations())   a.setName('Crying');
for (const a of docCapoeira.getRoot().listAnimations()) a.setName('Capoeira');

// Merge
console.log('Mesclando documentos...');
mergeDocuments(docIdle, docCrying);
mergeDocuments(docIdle, docCapoeira);

// Consolida múltiplos buffers em 1 único (obrigatório para GLB)
console.log('Consolidando buffers...');
const root = docIdle.getRoot();
const buffers = root.listBuffers();
console.log('Buffers encontrados:', buffers.length);

if (buffers.length > 1) {
    const bufferPrincipal = buffers[0];
    // Redireciona todos os accessors para o buffer principal
    for (const accessor of root.listAccessors()) {
        accessor.setBuffer(bufferPrincipal);
    }
    // Remove buffers extras
    for (let i = 1; i < buffers.length; i++) {
        buffers[i].dispose();
    }
}

await docIdle.transform(dedup(), prune());

console.log('Animações no mascote.glb final:');
root.listAnimations().forEach(a => console.log(' -', a.getName()));
console.log('Buffers finais:', root.listBuffers().length);

const buffer = await io.writeBinary(docIdle);
writeFileSync(resolve(__dirname, 'mascote.glb'), Buffer.from(buffer));
console.log('✅ mascote.glb salvo!');
