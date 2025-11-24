#!/usr/bin/env node

const { spawnSync } = require('child_process');
const readline = require('readline');

const TYPES = [
    { type: 'feat', description: 'Nueva funcionalidad para el usuario' },
    { type: 'fix', description: 'Corrección de bug' },
    { type: 'docs', description: 'Cambios de documentación únicamente' },
    { type: 'style', description: 'Formateo/cambios de estilo sin lógica (espacios, comillas)' },
    { type: 'refactor', description: 'Cambio de código sin añadir feature ni corregir bug' },
    { type: 'perf', description: 'Mejora de rendimiento' },
    { type: 'test', description: 'Agregar o ajustar pruebas' },
    { type: 'build', description: 'Cambios en build, dependencias o herramientas' },
    { type: 'ci', description: 'Cambios en pipelines/CI' },
    { type: 'chore', description: 'Tareas misceláneas sin tocar src ni tests' },
    { type: 'revert', description: 'Revertir un commit previo' },
];
const TYPE_VALUES = TYPES.map(({ type }) => type);
const SCOPE_HINT = 'Scope = área afectada; ejemplos: auth, api, db, ui, docs, tests. Deja vacío si no aplica.';

const printTypeHelp = () => {
    console.log('\nTipos permitidos:');
    TYPES.forEach(({ type, description }) => {
        console.log(`- ${type}: ${description}`);
    });
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const ask = (prompt, validate) =>
    new Promise((resolve) => {
        const query = () => {
            rl.question(prompt, (answer) => {
                const trimmed = answer.trim();
                const error = validate ? validate(trimmed) : null;
                if (error) {
                    console.log(error);
                    return query();
                }
                resolve(trimmed);
            });
        };
        query();
    });

const hasStagedChanges = () => {
    const result = spawnSync('git', ['diff', '--cached', '--quiet'], { stdio: 'inherit' });
    if (result.status === 1) return true;
    if (result.status === 0) return false;
    console.error('No se pudo comprobar cambios preparados. ¿Estás en un repo git?');
    process.exit(1);
};

const buildMessage = (type, scope, summary) => {
    const scopePart = scope ? `(${scope})` : '';
    return `${type}${scopePart}: ${summary}`;
};

(async () => {
    console.log('Asistente de commit (Conventional Commits)');
    const staged = hasStagedChanges();
    if (!staged) {
        console.error('No hay cambios preparados. Ejecuta `git add ...` antes de commitear.');
        rl.close();
        process.exit(1);
    }

    printTypeHelp();
    const type = await ask('Tipo (escribe ? para ver la lista): ', (value) => {
        if (value === '?' || value === 'help') {
            printTypeHelp();
            return 'Vuelve a ingresar un tipo de la lista.';
        }
        return TYPE_VALUES.includes(value) ? null : 'Elige un tipo válido.';
    });
    console.log(`\n${SCOPE_HINT}`);
    const scope = await ask('Scope (opcional, usa ? para ayuda): ', (value) => {
        if (value === '?' || value === 'help') {
            console.log(SCOPE_HINT);
            return 'Vuelve a ingresar el scope o deja vacío.';
        }
        if (value.includes(' ')) return 'Usa un scope sin espacios (ej. auth, api, ui).';
        return null;
    });
    const summary = await ask('Resumen corto (<=72 chars): ', (value) => {
        if (!value) return 'El resumen no puede estar vacío.';
        if (value.length > 72) return 'Mantén el resumen en 72 caracteres o menos.';
        return null;
    });

    const message = buildMessage(type, scope, summary);
    console.log(`\nCommit propuesto: "${message}"`);
    const confirm = await ask('¿Usar este mensaje? (y/n): ', (value) =>
        value !== 'y' && value !== 'n' ? 'Responde con y/n.' : null,
    );

    rl.close();
    if (confirm !== 'y') {
        console.log('Abortado. No se hizo commit.');
        process.exit(0);
    }

    const commit = spawnSync('git', ['commit', '-m', message], { stdio: 'inherit' });
    process.exit(commit.status ?? 1);
})().catch((error) => {
    console.error('Ocurrió un error:', error);
    rl.close();
    process.exit(1);
});
