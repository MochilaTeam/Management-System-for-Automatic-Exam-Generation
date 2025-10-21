# Guía de desarrollo: levantar servidor, probar `/ping`, base de datos y linter

> Esta guía te orienta para **levantar el contenedor**, **arrancar el servidor**, **probar la base de datos** y **correr el linter**. Incluye una breve explicación de cada comando y sus _flags_.
>
> El servidor escucha en **:5000**, **Docker Compose** levanta servicios `app` y `db` (MySQL), y tienes scripts de npm como `dev`, `lint` y `lint:fix`.

---

## 0) Requisitos previos

- **Docker** y **Docker Compose** instalados.
- Archivo **`.env`** en la raíz del proyecto (ejemplo):
  ```dotenv
  DB_HOST=db
  DB_PORT=3306
  DB_USER=root
  DB_PASSWORD=tu_password_segura
  DB_NAME=mi_app
  LOG_LEVEL=debug
  ```

---

## 1) Levantar servicios con Docker Compose

### A. Construir y arrancar en segundo plano

```bash
docker compose up -d --build
```

- `up`: crea y arranca los servicios definidos en `docker-compose.yml`.
- `-d`: _detached mode_ (no bloquea tu terminal).
- `--build`: fuerza a reconstruir la imagen si cambiaste el `Dockerfile` o dependencias.

### B. Ver estado de los servicios

```bash
docker compose ps
```

Muestra los contenedores, puertos publicados y estado (Up/Exited).

### C. Ver logs del servidor en vivo

```bash
docker compose logs -f app
```

- `logs`: imprime el registro de los contenedores.
- `-f`: _follow_ (sigue mostrando nuevas líneas).

> Para detener todo: `docker compose down`  
> Para detener **y** borrar volúmenes (incluida la DB): `docker compose down -v`

---

## 2) Probar que el servidor responde (`/ping` con curl)

### A. Prueba básica

```bash
curl http://localhost:5000/ping
```

Deberías ver algo como:

```json
{ "message": "pong" }
```

### B. Con cabeceras y código HTTP

```bash
curl -i http://localhost:5000/ping
```

- `-i`: incluye cabeceras de la respuesta (útil para ver `HTTP/1.1 200 OK`).

---

## 3) Probar que la base de datos está corriendo

### A. Entrar al cliente MySQL dentro del contenedor

```bash
docker compose exec db mysql -u root -p
```

- `exec db`: ejecuta un comando en el contenedor del servicio `db`.
- `mysql -u root -p`: abre el cliente MySQL, pedirá la contraseña (`DB_PASSWORD`).

### B. Comandos de verificación dentro de MySQL

```sql
SELECT VERSION();           -- versión del servidor (confirma que responde)
SHOW DATABASES;             -- lista bases disponibles
USE mi_app;                 -- selecciona tu base (reemplaza por DB_NAME real)
SHOW TABLES;                -- lista tablas de esa base
SELECT * FROM questions LIMIT 5;  -- prueba lectura en tu tabla (si existe)
STATUS;                     -- info de conexión, host y puerto
```

> Si `USE mi_app;` responde `Database changed`, tienes acceso correcto.

---

## 4) Correr el linter (ESLint) y formateo

### A. Dentro del contenedor (recomendado para homogeneidad)

```bash
docker compose exec app npm run lint
docker compose exec app npm run lint:fix
```

- `exec app`: corre el comando dentro del contenedor `app`.
- `npm run lint`: ejecuta el script que normalmente será algo como `eslint "app/**/*.{ts,tsx}"`.
- `npm run lint:fix`: igual que arriba pero con `--fix`, que **auto-corrige** problemas seguros (espaciado, comillas, etc.).

### B. Desde tu máquina (si tienes Node/npm)

```bash
npm run lint
npm run lint:fix
```

### C. Flags útiles de ESLint

- `--fix`: aplica correcciones automáticas cuando es posible.
- `--max-warnings=0`: hace que ESLint devuelva código de salida distinto de cero si hay **warnings** (útil en CI).
- `--cache`: habilita caché para acelerar linting en ejecuciones posteriores.
- `--ext .ts,.tsx`: especifica extensiones si tus scripts no lo hacen ya.
- `--format stylish|json|codeframe`: cambia el formato de salida.

### D. Prettier

```bash
npm run format
```

Suele ejecutar `prettier --write` para formateo consistente del código.

---

## 6) Checklist rápido

1. `docker compose up -d --build`
2. `docker compose logs -f app` y verifica que escuche en `:5000`
3. `curl http://localhost:5000/ping` ⇒ `{"message":"pong"}`
4. `docker compose exec db mysql -u root -p` ⇒ `SELECT VERSION(); SHOW DATABASES; USE mi_app; SHOW TABLES;`
5. `docker compose exec app npm run lint` / `npm run lint:fix`

¡Listo! Con esto tienes un circuito completo para levantar, probar y mantener saludable tu entorno de desarrollo. 🚀
