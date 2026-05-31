import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup, mergeDocuments } from '@gltf-transform/functions';
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

// Renomeia para nomes limpos e únicos
for (const a of docIdle.getRoot().listAnimations())     a.setName('Idle');
for (const a of docCrying.getRoot().listAnimations())   a.setName('Crying');
for (const a of docCapoeira.getRoot().listAnimations()) a.setName('Capoeira');

// Merge usando a função correta da API
console.log('Mesclando documentos...');
mergeDocuments(docIdle, docCrying);
mergeDocuments(docIdle, docCapoeira);

await docIdle.transform(dedup(), prune());

console.log('Animações no mascote.glb final:');
docIdle.getRoot().listAnimations().forEach(a => console.log(' -', a.getName()));

const buffer = await io.writeBinary(docIdle);
writeFileSync(resolve(__dirname, 'mascote.glb'), Buffer.from(buffer));
console.log('✅ mascote.glb salvo!');
