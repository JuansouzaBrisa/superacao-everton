import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup } from '@gltf-transform/functions';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, readdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

console.log('Arquivos .glb:', readdirSync(__dirname).filter(f => f.endsWith('.glb')));

async function lerGLB(nome) {
    const buf = readFileSync(resolve(__dirname, nome));
    return await io.readBinary(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
}

// Lê os 3 documentos
console.log('\nLendo arquivos...');
const docIdle     = await lerGLB('SadI-dle.glb');
const docCrying   = await lerGLB('Crying.glb');
const docCapoeira = await lerGLB('Capoeira.glb');

// Mostra animações originais para debug
console.log('\nAnimações em SadI-dle.glb:');
docIdle.getRoot().listAnimations().forEach(a => console.log(' -', JSON.stringify(a.getName())));

console.log('\nAnimações em Crying.glb:');
docCrying.getRoot().listAnimations().forEach(a => console.log(' -', JSON.stringify(a.getName())));

console.log('\nAnimações em Capoeira.glb:');
docCapoeira.getRoot().listAnimations().forEach(a => console.log(' -', JSON.stringify(a.getName())));

// Renomeia para nomes limpos
for (const a of docIdle.getRoot().listAnimations())     a.setName('Idle');
for (const a of docCrying.getRoot().listAnimations())   a.setName('Crying');
for (const a of docCapoeira.getRoot().listAnimations()) a.setName('Capoeira');

// ── Merge manual via Document.merge (API oficial) ──────────────────────────
// Importa a função merge da API do gltf-transform
const { Document } = await import('@gltf-transform/core');

// Cria documento final combinando os 3
const docFinal = new Document();
docFinal.merge(docIdle);
docFinal.merge(docCrying);
docFinal.merge(docCapoeira);

await docFinal.transform(dedup(), prune());

console.log('\nAnimações no mascote.glb final:');
docFinal.getRoot().listAnimations().forEach(a => console.log(' -', a.getName()));

// Salva
const buffer = await io.writeBinary(docFinal);
writeFileSync(resolve(__dirname, 'mascote.glb'), Buffer.from(buffer));
console.log('\n✅ mascote.glb salvo com sucesso!');
