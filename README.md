# App del gimnasio en GitHub — guía paso a paso

```
 Celular / PC (app instalada)            Google (privado, suyo)
 ┌─────────────────────────────┐         ┌──────────────────────────────┐
 │ GitHub Pages                │  HTTPS  │ Apps Script (Code.gs)        │
 │ index.html  → recepción     │ ──────► │  · valida clave, sesión, rol  │
 │ socio.html  → socios        │  JSON   │  · guarda en la Hoja Google  │
 │ (solo pantallas, sin datos) │ ◄────── │  · fotos en Drive privado    │
 └─────────────────────────────┘         └──────────────────────────────┘
```

GitHub solo muestra las **pantallas**. Los **datos** y el **código del servidor** siguen en su Google y **nunca** se suben a GitHub. El enlace de Google que ya usa sigue funcionando.

Tiempo estimado: **20 a 30 minutos** la primera vez.

---

## PARTE A — Preparar Google Apps Script (servidor)

### A1. Actualizar el proyecto
En el editor de Apps Script, deje estos archivos con la **última versión** (paquete *apps-script-privado*):

| Archivo | Tipo |
|---|---|
| `Code.gs` | Script |
| `Index`, `Estilos`, `Api`, `JavaScript`, `Grafica`, `Animaciones`, `AnimCatalogo`, `Socio`, `SocioJS` | HTML (**+ > HTML**, nombre sin `.html`) |

Ejecute **`setup`** y luego **`diagnostico`** (seleccione la función arriba y pulse ▶ Ejecutar). Todo debe salir ✅.

### A2. Publicar con acceso para "Cualquier persona"
1. **Implementar > Administrar implementaciones > ✏️ (lápiz)**.
2. **Versión:** *Nueva versión*.
3. **Ejecutar como:** *Yo*.
4. **Quién tiene acceso:** **Cualquier persona**.
   > Es obligatorio: la app de GitHub se conecta sin cuenta de Google. La seguridad la dan las contraseñas, las sesiones y los permisos por rol.
5. **Implementar** y copie la **URL de la aplicación web**, la que termina en `/exec`.

### A3. Probar que el servidor responde (¡importante!)
Abra una **ventana de incógnito** (Ctrl + Shift + N) y pegue la URL agregando `?p=ping` al final:

```
https://script.google.com/macros/s/SU-ID/exec?p=ping
```

- ✅ Si ve `{"ok":true,"app":"gym",...}`, el servidor está listo. Siga a la Parte B.
- ❌ Si le pide **iniciar sesión** o dice **"no tiene permiso"**, el acceso no quedó en "Cualquier persona".
  - Si en el paso A2 **no aparece** la opción *Cualquier persona*, su cuenta corporativa (Google Workspace) lo tiene bloqueado. Debe crear el proyecto y la hoja en una **cuenta Gmail propia o del gimnasio**. Esto también es lo recomendable para un negocio propio, separado de la empresa donde trabaja.

---

## PARTE B — Crear la cuenta y el repositorio en GitHub

### B1. Cuenta
1. Entre a **https://github.com** > **Sign up** y cree su cuenta. El **nombre de usuario** formará parte de la dirección: `usuario.github.io`.
2. Active la **verificación en dos pasos**: foto de perfil > **Settings > Password and authentication > Enable two-factor authentication**.

### B2. ¿Repositorio público o privado?
| | Público (gratis) | Privado (GitHub Pro, pago mensual) |
|---|---|---|
| Datos de socios | Privados (están en Google) | Privados (están en Google) |
| Código del servidor | Privado (no se sube) | Privado (no se sube) |
| Pantallas (HTML/JS) | Cualquiera puede ver el código | Nadie lo ve |
| GitHub Pages | ✅ Incluido | ✅ Requiere Pro |

Para empezar, **público funciona**. Si quiere ocultar el código de las pantallas, active GitHub Pro: foto > *Settings > Billing and plans*.

### B3. Crear el repositorio
1. Arriba a la derecha **+ > New repository**.
2. **Repository name:** por ejemplo `kinggym-app`.
3. Elija **Public** o **Private**.
4. **No** marque "Add a README". **Create repository**.

### B4. Subir los archivos
1. Descomprima `repo-github-gimnasio.zip` en su PC.
2. En la página del repositorio, pulse **uploading an existing file** (o **Add file > Upload files**).
3. **Arrastre todo el contenido** de la carpeta descomprimida: `src`, `pwa`, `scripts`, `.github`, `config.json`, `package.json`, `package-lock.json`, `README.md`, `LICENSE`, `.gitignore`.
4. Abajo pulse **Commit changes**.

> ⚠️ **La carpeta `.github` es indispensable** (publica la app automáticamente). Algunos computadores la ocultan por empezar con punto. Revise que en el repositorio aparezca `.github/workflows/publicar.yml`. Si no aparece, créela a mano:
> **Add file > Create new file**, en el nombre escriba exactamente `.github/workflows/publicar.yml`, pegue el contenido del anexo al final de esta guía y pulse **Commit changes**.

### B5. Configurar `config.json`
1. En el repositorio abra **`config.json`** y pulse el **lápiz ✏️** (Edit).
2. Cambie los valores:
   ```json
   {
     "API_URL": "https://script.google.com/macros/s/SU-ID-REAL/exec",
     "NOMBRE": "KING GYM",
     "DOMINIOS_PERMITIDOS": ["su-usuario.github.io"]
   }
   ```
   - `API_URL`: la URL que copió en el paso A2, **completa**.
   - `DOMINIOS_PERMITIDOS`: su usuario de GitHub seguido de `.github.io`, en minúsculas.
3. **Commit changes**.

### B6. Activar GitHub Pages
1. En el repositorio: **Settings > Pages** (menú izquierdo).
2. **Build and deployment > Source:** elija **GitHub Actions**.

### B7. Publicar
1. Vaya a la pestaña **Actions**. Verá "Publicar app en GitHub Pages" en ejecución (círculo amarillo).
2. Espere el **✅ verde** (1 a 2 minutos).
   - Si sale una ❌, ábrala y lea el error. El más común es *"falta pegar en API_URL…"*: corrija `config.json` (paso B5).
   - Si no arrancó sola, pulse **Run workflow**.
3. Al terminar, **Settings > Pages** muestra la dirección. Sus enlaces son:
   - **Principal:** `https://su-usuario.github.io/kinggym-app/`
   - **App de socios para instalar:** `https://su-usuario.github.io/kinggym-app/socio.html`

   Las dos tienen **la misma pantalla de ingreso**: el personal escribe su usuario y los socios su cédula. Cada uno llega a su sección.

---

## PARTE C — Probar e instalar

### C1. Probar
1. Abra el enlace **Principal** y entre con su usuario y contraseña: abre recepción.
2. En la misma pantalla, entre con la **cédula** y la contraseña temporal de un socio con pago activo: abre la app de rutinas.

### C2. Instalar como app
- **Android (Chrome):** botón **📲 Instalar app**, o menú ⋮ > *Instalar aplicación*.
- **iPhone (Safari):** botón Compartir ⬆️ > *Agregar a pantalla de inicio*.
- **PC (Chrome o Edge):** ícono de instalar ⊕ en la barra de direcciones.

Son dos apps: **Recepción** (ícono amarillo) y **Socios** (ícono negro).

### C3. Entregar el acceso a los socios
En la app de recepción, en **Rutinas**, pulse **📲 Dar acceso a todos los activos sin contraseña**. Cada mensaje de WhatsApp ya lleva el enlace de socios de GitHub.

---

## Actualizar la app más adelante
- **Pantallas:** edite los archivos de `src/` en GitHub (lápiz ✏️ > Commit). Se publica sola en 1 a 2 minutos.
- **Servidor:** cambie `Code.gs` en Apps Script y publique una **nueva versión** en la **misma implementación** (así la URL no cambia).
- En los celulares la app se actualiza sola al abrirla con internet.

## Solución de problemas
| Síntoma | Causa y solución |
|---|---|
| "No se pudo conectar con el servidor" | La URL en `config.json` está mal, o la implementación no es "Cualquier persona". Pruebe el paso A3. |
| "Contenido equivocado" o un texto `<?!= include(...) ?>` | En Apps Script un archivo HTML tiene pegado el contenido de otro. El mensaje dice cuál: bórrelo todo, pegue el correcto, ejecute `diagnostico` y publique una nueva versión. |
| "Operación no permitida" | En Apps Script hay un `Code.gs` viejo. Actualícelo y publique una nueva versión. |
| "Copia no autorizada" | `DOMINIOS_PERMITIDOS` no coincide con la dirección. Use `su-usuario.github.io`, sin `https://` ni `/`. |
| La Action falla en "npm ci" | Falta `package-lock.json`. Súbalo de nuevo desde el zip. |
| No aparece "Instalar app" | Ábrala en Chrome o Edge (no dentro de WhatsApp) y espere unos segundos. En iPhone use Safari. |
| Cambié algo y no se ve | Cierre y abra la app. Si sigue igual, recargue con Ctrl + F5. |

## Seguridad incluida
- Datos solo en su Google. GitHub no tiene datos ni el código del servidor.
- **Contraseñas**:
  - temporal aleatoria entregada por recepción;
  - en el primer ingreso cada persona crea la suya (mínimo 8 caracteres);
  - se bloquean las contraseñas comunes, las que contienen datos personales y las filtradas en internet;
  - se guardan cifradas con sal y 1.000 rondas.
- Bloqueo tras 5 intentos, cierre de sesión de recepción tras 30 minutos sin uso y registro en la pestaña *Auditoria*.
- La app de socios solo funciona con la membresía activa, y el personal desactivado pierde el acceso.
- El servidor solo acepta las operaciones de la app. Funciones como `setup`, los respaldos o el diagnóstico no se pueden ejecutar desde internet.
- Licencia de uso (`LICENCIA_VENCE`), la app solo funciona en su dominio y lo publicado va minificado.
- Respaldo diario de la hoja en su Drive (`instalarActivadores`).

---

## Anexo — contenido de `.github/workflows/publicar.yml`
```yaml
name: Publicar app en GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  construir:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  publicar:
    needs: construir
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.despliegue.outputs.page_url }}
    steps:
      - id: despliegue
        uses: actions/deploy-pages@v4
```

---
© 2026 John Jairo Calvo Castaño — Todos los derechos reservados (ver `LICENSE`).
