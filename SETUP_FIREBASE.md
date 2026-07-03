# Configuracion de Firebase Auth (requerida una sola vez)

Antes de este cambio, el panel de Admin se protegia con una contrasena fija escrita en el
codigo del cliente (`Admin2026`), visible para cualquiera que abriera el código fuente de la
pagina. Cualquiera que conociera la URL y la API key de Firebase (tambien visibles en el
codigo, algo normal en apps web de Firebase) podia escribir directo a la base de datos sin
pasar por la app, sin que existiera ninguna regla de seguridad en el proyecto.

Ahora el admin se autentica con Firebase Authentication (correo + contrasena) y las reglas de
la base de datos (`database.rules.json`) exigen esa autenticacion para escribir. Estos pasos
se hacen **una sola vez**, en la consola de Firebase (no en este repositorio), y no pueden
automatizarse desde aqui porque requieren acceso a tu proyecto de Firebase.

## Pasos

1. **Habilitar los metodos de acceso**
   - Ve a [Firebase Console](https://console.firebase.google.com/) &rarr; tu proyecto
     `quiniela-papanando` &rarr; **Authentication** &rarr; pestana **Sign-in method**.
   - Habilita **Anonymous** (la usan todos los participantes, sin que lo noten, para poder
     leer/escribir sus propias predicciones).
   - Habilita **Email/Password** (la usaras tu, como admin).

2. **Crear tu usuario de admin**
   - En **Authentication** &rarr; pestana **Users** &rarr; **Add user**.
   - Ingresa un correo y una contrasena (guardalos bien, son tus credenciales de admin).
   - Copia el **User UID** que se genera (una cadena larga tipo `aB3dEfGh...`).

3. **Autorizar ese UID como admin**
   - Ve a **Realtime Database** &rarr; pestana **Data**.
   - Crea (o edita) un nodo `pap26_admins` y dentro un hijo con el UID que copiaste, con
     valor `true`. Debe quedar asi:
     ```json
     "pap26_admins": {
       "aB3dEfGh...": true
     }
     ```
   - Sin este paso, aunque inicies sesion con tu correo y contrasena, la app te dira que tu
     cuenta existe pero no esta autorizada como admin (asi evitamos que cualquier cuenta de
     Firebase Auth se auto-otorgue el panel de Admin).

4. **Publicar las reglas de seguridad**
   - Ve a **Realtime Database** &rarr; pestana **Rules**.
   - Pega el contenido completo del archivo [`database.rules.json`](./database.rules.json) de
     este repositorio.
   - Presiona **Publish**.

5. **Verificar**
   - Abre la app, entra a la pestana **Admin**, ingresa el correo/contrasena del paso 2.
   - Deberias ver el panel de Admin completo (resultados reales, participantes, etc).
   - Si ves el mensaje "no esta autorizada como admin", revisa que el UID en el paso 3 sea
     exactamente el mismo que aparece en Authentication &rarr; Users para ese correo.

## Notas

- Los participantes normales **no** necesitan hacer nada: la app los autentica de forma
  anonima automaticamente al cargar, de forma transparente.
- Si en el futuro quieres agregar otro admin, repite los pasos 2 y 3 con su propio correo/UID.
- Las reglas dejan `pap26_admins` de solo lectura para escritura publica (nadie puede
  auto-agregarse como admin desde el cliente); solo tu, editando la base de datos manualmente
  desde la consola, puedes otorgar ese rol.
