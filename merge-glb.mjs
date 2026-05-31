import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup } from '@gltf-transform/functions';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

// Carrega os 3 documentos
const docIdle     = await io.read('Sad Idle.glb');
const docCrying   = await io.read('Crying.glb');
const docCapoeira = await io.read('Capoeira.glb');

// Renomeia as animações para nomes limpos
for (const anim of docIdle.getRoot().listAnimations()) {
    anim.setName('Idle');
}
for (const anim of docCrying.getRoot().listAnimations()) {
    anim.setName('Crying');
}
for (const anim of docCapoeira.getRoot().listAnimations()) {
    anim.setName('Capoeira');
}

// Pega o documento base (Idle) e copia as animações dos outros dois
const root = docIdle.getRoot();

// Função para copiar animações entre documentos
function copiarAnimacoes(docOrigem, docDestino) {
    const rootOrigem  = docOrigem.getRoot();
    const rootDestino = docDestino.getRoot();

    for (const anim of rootOrigem.listAnimations()) {
        // Cria nova animação no documento destino
        const novaAnim = docDestino.createAnimation(anim.getName());

        for (const channel of anim.listChannels()) {
            const sampler  = channel.getSampler();
            const noSampler = docDestino.createAnimationSampler()
                .setInput(sampler.getInput())
                .setOutput(sampler.getOutput())
                .setInterpolation(sampler.getInterpolation());

            const noChannel = docDestino.createAnimationChannel()
                .setSampler(noSampler)
                .setTargetPath(channel.getTargetPath());

            novaAnim.addSampler(noSampler).addChannel(noChannel);
        }
    }
}

// Merge manual: copia animações para o documento base
copiarAnimacoes(docCrying,   docIdle);
copiarAnimacoes(docCapoeira, docIdle);

// Limpa duplicatas e nodes não usados
await docIdle.transform(dedup(), prune());

// Salva o arquivo final
await io.write('mascote.glb', docIdle);

console.log('✅ mascote.glb gerado com sucesso!');
console.log('Animações disponíveis:');
for (const anim of docIdle.getRoot().listAnimations()) {
    console.log(' -', anim.getName());
}
