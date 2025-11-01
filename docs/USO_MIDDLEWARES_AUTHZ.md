# Uso de los middlewares de **autenticación** y **autorización**

Este documento explica **cómo integrar** y **usar** los middlewares `authenticate`, `requireRoles` y `requireAllRoles` en tus rutas Express con TypeScript.

> Estructura:
>
> - `authenticate` en: `app/core/middlewares/authenticate.ts`
> - `requireRoles` / `requireAllRoles` en: `app/core/middlewares/authorize.ts`
> - Enum `Roles` en: `app/shared/enums/rolesEnum.ts`
> - Enum `HttpStatus` en: `app/shared/enums/httpStatusEnum.ts`

---

## 1) ¿Qué hace cada middleware?

- **`authenticate`** (Autenticación): Verifica el **JWT** enviado por el cliente (header `Authorization: Bearer <token>` o cookie), valida firma/`iss`/`aud`/`exp`, y si es correcto **puebla** `req.user` con:
  ```ts
  req.user = { id: string, roles: Roles[] }
  ```
  Si el token falta o es inválido/expiró → responde **401 Unauthorized**.

- **`requireRoles(...allowed: Roles[])`** (Autorización — *any of*): Exige que el usuario tenga **al menos uno** de los roles permitidos. Si NO cumple → **403 Forbidden**.

- **`requireAllRoles(...required: Roles[])`** (Autorización — *all of*): Exige que el usuario tenga **todos** los roles requeridos. Si NO cumple → **403 Forbidden**.

> Regla general:
> - Falta de autenticación → **401**
> - Autenticado pero sin permisos → **403**

---

## 2) Importar y registrar rutas protegidas

### 2.1. Ejemplo básico — crear router protegido

```ts
// app/modules/exam/exam.routes.ts
import { Router } from "express";
import { authenticate } from "../../core/auth/authenticate";
import { requireRoles, requireAllRoles } from "../../core/auth/authorize";
import { Roles } from "../../shared/enums/rolesEnum";

const router = Router();

// Crear examen: requiere TEACHER o HEAD_OF_SUBJECT
router.post(
  "/exams",
  authenticate,
  requireRoles(Roles.TEACHER, Roles.HEAD_OF_SUBJECT),
  async (req, res) => {
    // Lógica de creación de examen...
    res.status(201).json({ ok: true, createdBy: req.user!.id });
  }
);

// Aprobar examen: requiere TODOS los roles listados (ejemplo)
router.post(
  "/exams/:id/approve",
  authenticate,
  requireAllRoles(Roles.HEAD_OF_SUBJECT),
  async (req, res) => {
    // Lógica de aprobación...
    res.json({ ok: true, approvedBy: req.user!.id });
  }
);

export default router;
```

### 2.2. Montar el router en la app

```ts
// app/server.ts o app/app.ts
import express from "express";
import cookieParser from "cookie-parser";
import examRouter from "./modules/exam/exam.routes";

const app = express();
app.use(express.json());
app.use(cookieParser()); // si lees tokens desde cookies

app.use("/api", examRouter);

export default app;
```

---

## 3) Orden correcto de middlewares

El **orden importa**. En cada ruta, primero va **`authenticate`**, luego **`requireRoles`**/**`requireAllRoles`**, y por último tu **controlador**:

```ts
router.post(
  "/endpoint",
  authenticate,                 // 1) autentica y setea req.user
  requireRoles(Roles.ADMIN),    // 2) autoriza por rol
  controller                    // 3) ejecuta lógica
);
```

Si inviertes el orden, `requireRoles` no verá `req.user` y denegará (o lanzará error).

---

## 4) Respuestas y manejo de errores

- **Sin token** o token inválido/expirado:
  ```json
  HTTP/1.1 401 Unauthorized
  { "message": "Missing token" | "Invalid token" | "Token expired" }
  ```

- **Autenticado pero sin rol** suficiente:
  ```json
  HTTP/1.1 403 Forbidden
  { "message": "Forbidden" }
  ```

Puedes ajustar los mensajes unificando el helper `forbid(res, msg)` y centralizando textos en tus enums/constantes.

---

## 5) Ejemplos con `curl` para probar rápido

### 5.1. Sin token (debe fallar con 401)
```bash
curl -i -X POST http://localhost:3000/api/exams
```

### 5.2. Con token pero sin rol requerido (debe fallar con 403)
```bash
curl -i -X POST http://localhost:3000/api/exams \
  -H "Authorization: Bearer <ACCESS_JWT_SIN_ROL>"
```

### 5.3. Con token válido y rol permitido (debe pasar)
```bash
curl -i -X POST http://localhost:3000/api/exams \
  -H "Authorization: Bearer <ACCESS_JWT_CON_ROL>"
```

---


## 6) Patrón de uso recomendado por dominio

- Endpoints de **creación/edición** de exámenes → `TEACHER` o `HEAD_OF_SUBJECT` con `requireRoles`.
- Endpoints de **aprobación** → `HEAD_OF_SUBJECT` (o `ADMIN`) con `requireAllRoles` si quieres doble rol.
- Endpoints de **aplicación** (estudiante) → `STUDENT` con `requireRoles(Roles.STUDENT)`.

---


### Listo ✅
Con esto puedes proteger rutas de forma consistente: primero **autenticar**, luego **autorizar** según tus **roles**. 