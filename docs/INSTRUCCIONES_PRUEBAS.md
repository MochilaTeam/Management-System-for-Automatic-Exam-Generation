# 🧪 Tests — Comandos y Sintaxis de Ejemplo

## Comandos para ejecutar tests

```bash
# Suite completa (usa el script del package.json)
npm test

# Modo watch interactivo
npm run test:watch

# Alternativas directas
npx vitest run
npx vitest

# Un archivo específico
npx vitest run tests/smoke/ping.test.ts

# Patrón de archivos
npx vitest run "tests/domains/user/**/*.test.ts"

# Filtrar por nombre de suite/test
npx vitest -t "Ping"

# Cobertura
npx vitest run --coverage

# (Opcional) En Docker si el servicio es "app"
docker compose run --rm app npm test
