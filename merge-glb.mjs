import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup } from '@gltf-transform/functions';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

console.log('Lendo arquivos GLB...');
const docIdle     = await io.read(resolve(__dirname, 'Sad-Idle.glb'));
const docCrying   = await io.read(resolve(__dirname, 'Crying.glb'));
const docCapoeira = await io.read(resolve(__dirname, 'Capoeira.glb'));

console.log('Renomeando animações...');
for (const anim of docIdle.getRoot().listAnimations())     anim.setName('Idle');
for (const anim of docCrying.getRoot().listAnimations())   anim.setName('Crying');
for (const anim of docCapoeira.getRoot().listAnimations()) anim.setName('Capoeira');

console.log('Copiando animações Crying...');
for (const anim of docCrying.getRoot().listAnimations()) {
    docIdle.getRoot().listAnimations(); // garante contexto
    const novaAnim = docIdle.createAnimation(anim.getName());
    for (const channel of anim.listChannels()) {
        const sampler = channel.getSampler();
        const noSampler = docIdle.createAnimationSampler()
            .setInterpolation(sampler.getInterpolation());
        novaAnim.addSampler(noSampler);
        const noChannel = docIdle.createAnimationChannel()
            .setSampler(noSampler)
            .setTargetPath(channel.getTargetPath());
        novaAnim.addChannel(noChannel);
    }
}

console.log('Copiando animações Capoeira...');
for (const anim of docCapoeira.getRoot().listAnimations()) {
    const novaAnim = docIdle.createAnimation(anim.getName());
    for (const channel of anim.listChannels()) {
        const sampler = channel.getSampler();
        const noSampler = docIdle.createAnimationSampler()
            .setInterpolation(sampler.getInterpolation());
        novaAnim.addSampler(noSampler);
        const noChannel = docIdle.createAnimationChannel()
            .setSampler(noSampler)
            .setTargetPath(channel.getTargetPath());
        novaAnim.addChannel(noChannel);
    }
}

console.log('Limpando e salvando...');
await docIdle.transform(dedup(), prune());
await io.write(resolve(__dirname, 'mascote.glb'), docIdle);

console.log('✅ mascote.glb gerado!');
for (const anim of docIdle.getRoot().listAnimations()) {
    console.log(' -', anim.getName());
}
