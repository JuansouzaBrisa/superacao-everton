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
const docBase     = await lerGLB('SadI-dle.glb');
const docCrying   = await lerGLB('Crying.glb');
const docCapoeira = await lerGLB('Capoeira.glb');

// Renomeia animações
for (const a of docBase.getRoot().listAnimations())     a.setName('Idle');
for (const a of docCrying.getRoot().listAnimations())   a.setName('Crying');
for (const a of docCapoeira.getRoot().listAnimations()) a.setName('Capoeira');

// Remove TUDO dos documentos secundários exceto as animações
// Isso evita duplicar malha/texturas no merge
function limparMantendoAnimacoes(doc) {
    const root = doc.getRoot();
    // Remove meshes, materials, textures, skins — mantém só animações e accessors
    for (const mesh of root.listMeshes())     mesh.dispose();
    for (const mat of root.listMaterials())   mat.dispose();
    for (const tex of root.listTextures())    tex.dispose();
    for (const skin of root.listSkins())      skin.dispose();
    for (const cam of root.listCameras())     cam.dispose();
    // Mantém nodes e animações intactos
}

console.log('Limpando documentos secundários...');
limparMantendoAnimacoes(docCrying);
limparMantendoAnimacoes(docCapoeira);

console.log('Mesclando...');
mergeDocuments(docBase, docCrying);
mergeDocuments(docBase, docCapoeira);

// Consolida buffers em 1
const root = docBase.getRoot();
const buffers = root.listBuffers();
console.log('Buffers antes:', buffers.length);
if (buffers.length > 1) {
    const principal = buffers[0];
    for (const acc of root.listAccessors()) acc.setBuffer(principal);
    for (let i = 1; i < buffers.length; i++) buffers[i].dispose();
}

await docBase.transform(dedup(), prune());

console.log('Buffers finais:', root.listBuffers().length);
console.log('Animações:');
root.listAnimations().forEach(a => console.log(' -', a.getName()));
console.log('Meshes:', root.listMeshes().length);
console.log('Texturas:', root.listTextures().length);

const buffer = await io.writeBinary(docBase);
writeFileSync(resolve(__dirname, 'mascote.glb'), Buffer.from(buffer));
console.log('✅ mascote.glb salvo! Tamanho:', (buffer.byteLength / 1024 / 1024).toFixed(2), 'MB');
