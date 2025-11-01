## Resumen ejecutivo

- **Estilo arquitectónico:** El proyecto _Management-System-for-Automatic-Exam-Generation_ adopta una **arquitectura Clean/Hexagonal con DDD** y modularidad por dominios, evidenciada por la separación entre `domains/*`, `infrastructure/*`, `core/*`, `shared/*` y `database/*`.
- **Capas claramente diferenciadas:** Interfaz (API), Aplicación, Dominio e Infraestructura están delineadas, ejemplos en el dominio `user` (`domains/user/api/*`, `domains/user/application/*`, `domains/user/domain/*`, `infrastructure/user/*`).
- **Puertos/Adaptadores presentes:** Los **puertos** de dominio están en `domains/user/domain/ports/ex.ts` (placeholder) y las **implementaciones** en `infrastructure/user/repositories/ex.ts` (placeholder), cumpliendo el principio de dependencias hacia adentro.
- **Cross-cutting robusto:** Observabilidad y middleware transversales en `core/logging/*` y `core/middlewares/*`, más contratos de respuesta/errores en `shared/domain/*` y `shared/exceptions/*`.


---

## Arquitectura

### Estilo(s) arquitectónico(s) 

- **Domain-Driven Design (DDD)**: separación por **bounded contexts** en `domains/exam-generation`, `domains/question-bank`, `domains/exam-application`, `domains/user`.
- **Clean/Hexagonal**:
  - **Dominios con puertos**: `domains/user/domain/ports/ex.ts`.
  - **Adaptadores/Infra**: `infrastructure/*/models/*.ts`, `infrastructure/user/repositories/ex.ts`, `infrastructure/user/mappers/ex.ts`.
  - **Dependencias hacia adentro**: API/Infra no aparecen referenciadas dentro de `domains/*/domain/*` (a partir del árbol).
- **En capas** (dentro de cada dominio completo): `domains/user/api/*` (interfaz), `domains/user/application/*` (aplicación), `domains/user/domain/*` (dominio), `infrastructure/user/*` (infra).

### Evidencias (carpetas → capas/elementos)

- **Interfaz/Entrega:** `domains/user/api/controllers/ex.ts`, `domains/user/api/routes/ex.ts`.
- **Aplicación:** `domains/user/application/commands/ex.ts`, `domains/user/application/queries/ex.ts`, `domains/user/application/services/ex.ts`.
- **Dominio:** `domains/user/domain/entities/ex.ts`, `domains/user/domain/ports/ex.ts`; enums/entidades de otros dominios en `domains/exam-application/entities/enum/*`, `domains/exam-generation/entities/enums/*`, `domains/question-bank/entities/enums/*`.
- **Infraestructura:** `infrastructure/exam-application/models/*.ts`, `infrastructure/exam-generation/models/*.ts`, `infrastructure/question-bank/models/*.ts`, `infrastructure/user/models/*.ts`, `infrastructure/user/repositories/ex.ts`, `infrastructure/user/mappers/ex.ts`.
- **Cross-cutting:** `core/middlewares/*.ts`, `core/logging/*`, `shared/domain/base_response.ts`, `shared/exceptions/*.ts`.
- **Persistencia:** `database/database.ts`, `database/init.ts`, `database/seed.ts`.

---

## Mapa de capas / módulos

| Ruta | Capa/Contexto | Rol/Responsabilidad | Evidencia de cumplimiento |
|---|---|---|---|
| `domains/user/api/controllers/ex.ts` | Interfaz (API) | Controladores HTTP | Controladores separados de dominio/infra. |
| `domains/user/api/routes/ex.ts` | Interfaz (API) | Definición de rutas | Rutas en capa API, no en dominio. |
| `domains/user/application/queries/ex.ts` | Aplicación | Casos de uso de lectura | Queries aisladas de ORM/HTTP. |
| `domains/user/application/commands/ex.ts` | Aplicación | Casos de uso de escritura | Commands independientes de infraestructura. |
| `domains/user/application/services/ex.ts` | Aplicación | Orquestación | Servicios de aplicación dedicados. |
| `domains/user/domain/entities/ex.ts` | Dominio | Entidades/reglas | Entidades sin referencias a frameworks. |
| `domains/user/domain/ports/ex.ts` | Dominio | Puertos (interfaces) | Contratos para repositorios/adaptadores. |
| `infrastructure/user/models/*.ts` | Infraestructura | Modelos de persistencia | Modelos fuera del dominio. |
| `infrastructure/user/repositories/ex.ts` | Infraestructura | Implementación de puertos | Repositorios concretos (placeholder). |
| `core/middlewares/*.ts` | Cross-cutting | Validación, errores, interceptores | `errorHandler.ts`, `requestValidator.ts`, `responseInterceptor.ts`. |
| `core/logging/*` | Cross-cutting | Logging estructurado y helpers | `logger.ts`, `helpers/*`, `enums/sensitiveKeys.ts`. |
| `shared/domain/base_response.ts` | Cross-cutting | Contrato de respuesta | Formato de respuesta estándar. |
| `database/*` | Infra/bootstrap | Conexión/seed | `database.ts`, `init.ts`, `seed.ts`. |

---


## Capa de aplicación e interfaces

- **Controladores y rutas (`user`):** `domains/user/api/controllers/`, `domains/user/api/routes/`.  
- **Validadores:** `core/middlewares/requestValidator.ts`, `domains/user/schemas/`.  
- **Middlewares transversales:** `core/middlewares/errorHandler.ts`, `core/middlewares/responseInterceptor.ts`, `core/middlewares/responseValidator.ts`.  
- **Inyección de dependencias (composition root):** `core/dependencies/dependencies.ts` 

---

## Capa de dominio y modelos

- **Entidades/Enums (`user`, `question-bank`, `exam-*`):** `domains/*/domain/entities/*.ts` y `domains/*/entities/**/enums/*.ts`.  
- **Puertos (`user`):** `domains/user/domain/ports/ex.ts` (placeholder).  
- **Relación con `shared/domain`:** `shared/domain/base_response.ts`, `shared/domain/base_service.ts` proveen contratos/utilidades reutilizables, sin acoplar al dominio a la infraestructura.

---

## Infraestructura y persistencia

- **Modelos de persistencia (ORM):**  
  - `infrastructure/user/models/*.ts`,  
  - `infrastructure/question-bank/models/*.ts`,  
  - `infrastructure/exam-generation/models/*.ts`,  
  - `infrastructure/exam-application/models/*.ts`.  
- **Repositorios concretos:** `infrastructure/user/repositories/ex.ts` (placeholder).  
- **Mappers (user):** `infrastructure/user/mappers/ex.ts` (placeholder).  
- **Inicialización BD:** `database/database.ts`, `database/init.ts`, `database/seed.ts`.

---

## Cross-cutting concerns

- **Logging:** `core/logging/logger.ts`, `core/logging/helpers/*` (p. ej., `formatHttpLoggerResponse.ts`, `sensitiveInfoExcluder.ts`, `timeStampFormat.ts`) y `core/logging/enums/sensitiveKeys.ts`.  
- **Errores y contratos comunes:** `shared/exceptions/appError.ts`, `shared/exceptions/domainErrors.ts`, `shared/domain/base_response.ts`.  
- **Middlewares:** `core/middlewares/*` (validación, interceptores, manejo de errores).

---

## Flujos típicos (secuencias)

> **Nota:** No se exponen endpoints concretos en el árbol; se ilustra el flujo usando rutas de archivos como evidencia.

- **Flujo de lectura en `user`:**  
  1) Request entra por **router** → `domains/user/api/routes/ex.ts`.  
  2) Pasa por **controller** → `domains/user/api/controllers/ex.ts`.  
  3) (Opcional) **requestValidator** → `core/middlewares/requestValidator.ts` y **schemas** → `domains/user/schemas/ex.ts`.  
  4) Llama a **query/service** → `domains/user/application/queries/ex.ts` / `domains/user/application/services/ex.ts`.  
  5) Accede a **puertos** → `domains/user/domain/ports/ex.ts`; impl en **infra** → `infrastructure/user/repositories/ex.ts`.  
  6) **Modelos ORM** → `infrastructure/user/models/*.ts`.  
  7) Devuelve **BaseResponse** → `shared/domain/base_response.ts`; **responseInterceptor** → `core/middlewares/responseInterceptor.ts`.

- **Flujo de escritura en `user`:** similar al anterior, cambiando **query** por **command** → `domains/user/application/commands/ex.ts`.

---

## Atributos de calidad y cómo se satisfacen

- **Modularidad por dominio:** separación en `domains/*` y `infrastructure/*`; evita acoplamientos cruzados.  
- **Separación de responsabilidades:** API (`domains/user/api/*`), Aplicación (`domains/user/application/*`), Dominio (`domains/user/domain/*`), Infra (`infrastructure/*`).  
- **Testabilidad:** puertos en `domains/user/domain/ports/*` permiten fakes/stubs; controladores y middlewares desacoplados (`core/middlewares/*`).  
- **Escalabilidad evolutiva:** modelos de infra fuera del dominio (`infrastructure/*/models/*`) facilitan cambio de ORM/DB. **Supuesto**. **Riesgo:** requiere disciplina en dependencias.  
- **Observabilidad:** logging y helpers (`core/logging/*`) y manejo consistente de respuestas/errores (`shared/domain/base_response.ts`, `core/middlewares/errorHandler.ts`).  
- **Mantenibilidad:** convención de carpetas y responsabilidades, más `core/dependencies/dependencies.ts` centralizando el wiring.

---

## Matriz de trazabilidad

| Elemento | Ruta | Capa | Atributo de calidad soportado | Evidencia |
|---|---|---|---|---|
| Controladores `user` | `domains/user/api/controllers/ex.ts` | Interfaz | Separación de responsabilidades | Controlador no en dominio/infra. |
| Rutas `user` | `domains/user/api/routes/ex.ts` | Interfaz | Modularidad | Rutas segregadas por dominio. |
| Queries/Commands | `domains/user/application/{queries,commands}/ex.ts` | Aplicación | Testabilidad, SRP | Casos de uso fuera de controllers/ORM. |
| Servicios app | `domains/user/application/services/ex.ts` | Aplicación | Mantenibilidad | Orquestación centralizada. |
| Entidades | `domains/user/domain/entities/ex.ts` | Dominio | DDD, independencia | Entidades aisladas. |
| Puertos | `domains/user/domain/ports/ex.ts` | Dominio | Sustituibilidad | Interfaces sin dependencias de ORM. |
| Modelos ORM | `infrastructure/*/models/*.ts` | Infra | Portabilidad | Persistencia fuera del dominio. |
| Repos impl. | `infrastructure/user/repositories/ex.ts` | Infra | Sustituibilidad | Implementa puertos del dominio. |
| Middlewares | `core/middlewares/*.ts` | Cross-cutting | Observabilidad, robustez | Validación/errores/interceptores. |
| Logging | `core/logging/*` | Cross-cutting | Observabilidad | Helpers, mask de sensibles. |
| DB bootstrap | `database/*` | Infra/bootstrap | Deployability | Conexión/seed fuera del dominio. |

---

## Riesgos, gaps y supuestos

- **Placeholders `ex.ts`:** en `domains/user/*/*/ex.ts`, `infrastructure/user/repositories/ex.ts`, `infrastructure/user/mappers/ex.ts` faltan implementaciones reales. **Riesgo:** no hay pruebas end-to-end.  
- **Dominios parciales:** `question-bank`, `exam-generation`, `exam-application` sólo muestran entidades/enums (`domains/*/entities/*`); no se observan `application`/`api` para esos contextos. **Riesgo:** flujo incompleto fuera de `user`.  
- **Contratos de repos faltantes (no `user`):** no se ven puertos en `domains/{question-bank,exam-*}/domain/ports`. **Riesgo:** acoplamiento a ORM si se implementa directo.  
- **Eventos/Bus:** No se observa un event bus en el árbol. **Supuesto:** comunicación sincrónica por ahora.  
- **DI por dominio:** sólo `core/dependencies/dependencies.ts` y un ejemplo en `core/dependencies/user/ex.ts`; no hay evidencia del wiring completo para todos los bounded contexts.

---


## Glosario

- **DDD:** Domain-Driven Design.  
- **Bounded context:** Límite lógico de un subdominio (p. ej., `user`, `question-bank`).  
- **Clean/Hexagonal:** Arquitectura con dependencias hacia adentro y puertos/adaptadores.  
- **Puerto (port):** Interfaz del dominio que define contratos a implementar por la infraestructura.  
- **Adaptador:** Implementación concreta de un puerto (p. ej., repositorio ORM).  
- **Cross-cutting:** Preocupaciones transversales (logging, validación, errores).


