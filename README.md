# PaTrackeApp - Technical Documentation

Este repositorio contiene el código fuente de **PaTrackeApp**, una aplicación web orientada a la gestión y geolocalización de vehículos aparcados, desarrollada con un enfoque funcional y persistencia de datos híbrida.

## ⛓️ Enlace desplegado
https://patrackeapp.onrender.com

## 🛠️ Stack Tecnológico Core

- **Framework de Servidor:** [Express 4.22.1](https://expressjs.com/) para la gestión de rutas y lógica de servidor.
- **Motor de Plantillas:** [EJS 5.0.1](https://ejs.co/) con `express-ejs-layouts` para la generación de vistas dinámicas.
- **Base de Datos:** [Better-SQLite3](https://github.com/Wise9/better-sqlite3) para una persistencia de datos rápida y eficiente en un archivo local `db.sqlite`.
- **Mapas:** [Leaflet.js](https://leafletjs.com/) para la visualización interactiva de la ubicación del vehículo y del usuario.
- **Estilos:** [Bootstrap 5.3.3](https://getbootstrap.com/) y CSS personalizado para una interfaz responsiva.

## 🎨 Identidad Visual e Implementación (CSS)

La interfaz utiliza una identidad visual clara orientada a la utilidad y la legibilidad:

- **Paleta de Colores:**
  - **Azul Principal:** `#0968EF` (usado en la barra de navegación y elementos de marca).
  - **Verde Éxito:** `#7DDF8B` (usado para acciones positivas y estados activos).
  - **Gris Neutro:** `#D9D9D9` (fondos y elementos secundarios).
- **Tipografía:**
  - **Poppins:** Fuente principal para todo el cuerpo de texto y botones.
  - **Zen Dots:** Utilizada específicamente para el logotipo `PaTrackeApp` en la navbar.

## 📂 Estructura del Proyecto

La organización del código sigue el patrón MVC (Modelo-Vista-Controlador) adaptado para Node.js:

```text
PaTrackeApp/
├── bin/                # Script de inicio del servidor (www)
├── data/               # Capa de persistencia (db.js, DAO's y SQLite)
├── middlewares/        # Middlewares de control (auth.js)
├── public/             # Recursos estáticos
│   ├── javascripts/    # Lógica de cliente (map.js)
│   └── stylesheets/    # Estilos CSS (style.css, root.css)
├── routes/             # Definición de endpoints (index.js, users.js)
├── views/              # Plantillas EJS (layout, index, login, error)
├── app.js              # Configuración central de Express
└── package.json        # Dependencias y scripts
```
## 🏗️ Arquitectura y Funcionalidades
La plataforma permite a los usuarios rastrear la ubicación de su coche mediante dos modalidades:

- **Modo Invitado:** Los datos se almacenan localmente en el navegador (localStorage), permitiendo el uso de la app sin registro.

- **Modo Usuario Registrado:** Los aparcamientos se sincronizan con el servidor en tiempo real, permitiendo recuperar el historial desde cualquier dispositivo.

- **Geolocalización en Tiempo Real:** Cálculo de distancia dinámica entre la posición actual del usuario y el vehículo mediante la fórmula de Haversine.

- **Historial de Aparcamientos:** Tabla interactiva gestionada con DataTables que muestra coordenadas, fecha, duración y estado de cada registro.

- **Seguridad:** Gestión de sesiones de usuario mediante express-session con almacenamiento de contraseñas en texto plano (entorno de desarrollo/educativo).

## ⚙️ Configuración y Scripts
Comandos definidos para la gestión del proyecto:
```text
npm install
```

Instala todas las dependencias necesarias, incluyendo el motor de base de datos SQLite.
```text
npm start
```
Inicia el servidor de producción en el puerto definido por el entorno o por defecto en http://localhost:3000.

Desarrollado por: Rafael Medina Quelle

