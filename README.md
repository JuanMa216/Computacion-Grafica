# ⚔️ Mili's Adventure

Videojuego 2D de plataformas y acción estilo *pixel art* desarrollado con **KaboomJS** y **Vite** para la asignatura de **Computación Gráfica**.

---

## 🎮 Sinopsis y Jugabilidad

Acompaña a **Mili**, una valiente caballera, en una épica travesía a través de mazmorras, cavernas subterráneas y una imponente torreela para purificar las tierras y derrotar al temible **Rey Demonio**.

### 🌟 Niveles y Mecánicas

1. **Nivel 1: El Castillo Abandonado**
   - Introducción al movimiento, salto y combate con espada.
   - Slimes patrulleros con inteligencia artificial (alerta, persecución y salto).
   - Recolección de monedas, gemas, llaves y apertura de puertas.

2. **Nivel 2: Las Cavernas Oscuras y Minas Subterráneas (120 Columnas)**
   - Plataformas móviles horizontales y ascensores verticales.
   - Trampolines elásticos con física de impulso.
   - Nuevos enemigos: **Orcos Guerreros** con ataques pesados y barra de daño.
   - **Mecánica Secreta de Grimorios**:
     - *Grimorio Carmesí*: Abre el portal a la Cripta Carmesí (Dungeon de Fuego).
     - *Grimorio Esmeralda*: Abre el portal a la Garganta Esmeralda (Dungeon Tóxica).
     - *Grimorio Celestial*: El único tomo sagrado que desbloquea el portal al Nivel Final.

3. **Nivel 3: La Torre del Rey Demonio (Diseño Vertical)**
   - Arquitectura vertical con cámara dinámica que sigue la ascensión de Mili.
   - Obstáculos de alta precisión: pinchos de calabozo, plataformas flotantes y trampolines.
   - **Batalla Final contra el Rey Demonio (Boss Fight)**:
     - 10 Puntos de Vida con barra de vida en el HUD.
     - Ataque de tajo con espada y choque telúrico que genera temblor en pantalla.
     - **Fase 2 (Enrage Mode)** al llegar a 5 HP o menos (aura de fuego, velocidad y agresividad aumentadas).

4. **🥚 Easter Egg Secreto: El Origen de la Leyenda**
   - Se desbloquea automáticamente si derrotas al Rey Demonio con **5.000 puntos o más**.
   - Escenario nostálgico con minijuego interactivo de **Baloncesto**:
     - Balón con física de rebote que puedes patear o golpear con la espada.
     - Anotación en el aro con anuncio de *¡CANASTA LEGENDARIA! (+500 pts)*.
     - Copa Suprema para alcanzar la victoria final al 100%.

---

## 🕹️ Controles

| Acción | Teclas |
| :--- | :--- |
| **Moverse** | `A` / `D` o `Flechas Izquierda / Derecha` |
| **Saltar / Doble Salto** | `Espacio` |
| **Atacar (Espada)** | `Z` o `J` |
| **Bloquear (Escudo)** | `Shift` o `C` |
| **Pantalla Completa** | `F` |
| **Reiniciar Juego** | `R` (en pantalla de victoria o Game Over) |

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos
- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
- `npm`

### Pasos

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/JuanMa216/Computacion-Grafica.git
   cd Computacion-Grafica
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abre tu navegador en `http://localhost:3000/`.

4. Compilar para producción:
   ```bash
   npm run build
   ```

---

## 🛠️ Tecnologías Utilizadas

- **Motor de Juegos**: [KaboomJS](https://kaboomjs.com/) (v3000.1.17)
- **Empaquetador y Dev Server**: [Vite](https://vitejs.dev/) (v6.4.6)
- **Lenguaje**: JavaScript (ES6+ Modules)
- **Estética Visual**: Pixel art medieval y fantasía oscura con renderizado pixelado nítido (*crisp edges*).

---

## 👤 Autor

- **Juan Manuel Rojas** ([@JuanMa216](https://github.com/JuanMa216))
- Universidad Tecnológica de Pereira (UTP)
