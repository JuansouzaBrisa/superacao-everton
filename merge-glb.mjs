import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup } from '@gltf-transform/functions';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, readdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Lista arquivos .glb encontrados para debug
const glbsEncontrados = readdirSync(__dirname).filter(f => f.endsWith('.glb'));
console.log('Arquivos .glb encontrados:', glbsEncontrados);

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

// Lê GLB como binário puro (evita problema com nomes e JSON corrompido)
async function lerGLB(nome) {
    const caminho = resolve(__dirname, nome);
    const buffer = readFileSync(caminho);
    return await io.readBinary(new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength));
}

console.log('Lendo SadI-dle.glb...');
const docIdle = await lerGLB('SadI-dle.glb');

console.log('Lendo Crying.glb...');
const docCrying = await lerGLB('Crying.glb');

console.log('Lendo Capoeira.glb...');
const docCapoeira = await lerGLB('Capoeira.glb');

console.log('Renomeando animações...');
for (const anim of docIdle.getRoot().listAnimations())     anim.setName('Idle');
for (const anim of docCrying.getRoot().listAnimations())   anim.setName('Crying');
for (const anim of docCapoeira.getRoot().listAnimations()) anim.setName('Capoeira');

console.log('Mesclando Crying...');
for (const anim of docCrying.getRoot().listAnimations()) {
    docIdle.getRoot().listScenes(); // força contexto
    const novaAnim = docIdle.createAnimation(anim.getName());
    for (const sampler of anim.listSamplers()) {
        docIdle.createAnimationSampler().setInterpolation(sampler.getInterpolation());
    }
}

console.log('Mesclando Capoeira...');
for (const anim of docCapoeira.getRoot().listAnimations()) {
    docIdle.createAnimation(anim.getName());
}

console.log('Salvando mascote.glb...');
await docIdle.transform(dedup(), prune());
const glbBuffer = await io.writeBinary(docIdle);
writeFileSync(resolve(__dirname, 'mascote.glb'), Buffer.from(glbBuffer));

console.log('✅ Concluído!');
for (const anim of docIdle.getRoot().listAnimations()) {
    console.log(' -', anim.getName());
}
