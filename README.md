# 🧬 Pokémon Gallery - Angular App

Una galería moderna e interactiva de Pokémon construida con **Angular 20**, **Angular Material**, animaciones, gráficos y conexión con IA.  
Diseñada con una experiencia de usuario fluida, responsiva y visualmente atractiva. ¡Explora, busca y conoce a tus Pokémon favoritos como nunca antes!

---

## 🚀 Demo en producción

🔗 **Desplegado en Netlify:**  
👉 [https://pokemon-gallery-prueba.netlify.app](https://pokemon-gallery-prueba.netlify.app)

---

## 🛠️ Tecnologías Utilizadas

| Tecnología        | Descripción                                            |
|------------------|--------------------------------------------------------|
| 🔥 Angular 20     | Framework principal del proyecto                      |
| 🎨 Angular Material | Componentes UI con diseño moderno (Material Design) |
| 📊 Chart.js       | Visualización de estadísticas de cada Pokémon         |
| 🤖 Gemini (IA)    | Generación automática de biografías descriptivas vía IA |
| 🎥 Animaciones    | Pokébola animada al abrir el detalle de un Pokémon    |
| 🕹️ SSR opcional   | Preparado para Server Side Rendering con Angular SSR |
| 🖼️ Netlify        | Despliegue y hosting continuo                         |

---

## ✨ Funcionalidades Clave

### 🧠 Conexión con Gemini (IA)
- Se generan biografías descriptivas para cada Pokémon usando la API de Gemini (Google AI).
- Las descripciones son dinámicas, adaptadas por especie.

### 🔍 Búsqueda en Vivo
- Barra de búsqueda en tiempo real que filtra Pokémon mientras escribes.
- Si el Pokémon no está en el listado, se hace una búsqueda directa a la API oficial.

### 🎨 Estilos Personalizados por Tipo
- Cada tarjeta de Pokémon tiene **colores dinámicos** basados en su tipo (`fire`, `water`, etc.).
- Mejora la lectura visual e identificación rápida de tipo.

### 📈 Gráficas de Estadísticas
- Cada detalle de Pokémon incluye un **gráfico radar** con sus estadísticas (HP, Speed, Attack...).
- Interactivo y responsivo con Chart.js.

### ⚡ Animaciones
- Apertura de **Pokébola animada** antes de mostrar el modal de detalle.
- Microinteracciones para hover, favoritos y navegación.

### 🧭 Modal de Detalles (con URL sincronizada)
- Cada Pokémon puede abrirse en un modal desde:
  - Clic en tarjeta
  - Clic en botón
  - Escribiendo directamente en la URL `/pokemon/{name}`
- El modal se abre correctamente incluso al recargar o compartir URL.

### ❤️ Favoritos
- Marcado y gestión de Pokémon favoritos.
- Persistencia local (puede integrarse con login en el futuro).

---

## 📁 Estructura del Proyecto (Resumen)

