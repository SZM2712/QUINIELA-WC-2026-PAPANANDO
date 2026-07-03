# Mi IA Offline

Chatbot personal que corre **enteramente en tu navegador**: no hay servidor, no hay API externa, no se manda nada a internet. Sirve para hacerle preguntas generales y también para subirle tus propios documentos y que los use como contexto al responder.

## Cómo usarlo

1. Abrí `index.html` en Chrome o Edge actualizado (PC recomendado; en Android funciona en Chrome reciente si el equipo tiene suficiente RAM). Necesita soporte de **WebGPU**.
2. Tocá **⚙️ Modelo**, elegí un modelo (por defecto Qwen2.5 7B) y tocá **Cargar modelo**. La primera vez descarga varios GB — necesitás internet solo para esta descarga única.
3. Una vez cargado, el modelo queda guardado en el navegador (Cache API). Las próximas veces que abras la app, **no hace falta internet**.
4. Tocá **📄 Documentos** para subir archivos `.txt`, `.md`, `.csv` o `.json` con información tuya. El chatbot busca en ellos localmente (sin IA, con un algoritmo TF-IDF simple) y le pasa los fragmentos relevantes al modelo como contexto antes de responder.
5. Escribí y chateá. Las conversaciones y documentos quedan guardados en el navegador (IndexedDB) entre sesiones.

## Notas técnicas

- El modelo de lenguaje corre con [WebLLM](https://github.com/mlc-ai/web-llm) sobre WebGPU.
- La búsqueda de contexto sobre tus documentos es local (TF-IDF), no requiere descargar un modelo de embeddings aparte.
- Un Service Worker cachea la app (HTML/JS) para que abra offline; el peso del modelo lo gestiona WebLLM con su propio caché en el navegador.
- Si tu dispositivo no tiene suficiente memoria para el modelo elegido, probá una opción más liviana desde el selector (Phi-3.5 mini o Gemma-2 2B).
- Todo el procesamiento (chat y búsqueda en documentos) pasa en tu dispositivo. Nada se envía a servidores externos.

## Publicarlo para usarlo desde el celular

Podés servir esta carpeta con GitHub Pages (o cualquier hosting estático) y luego "Agregar a pantalla de inicio" desde el navegador del celular para que se comporte como una app instalada (PWA).
