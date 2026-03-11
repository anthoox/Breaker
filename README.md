# Breaker (2026)
Breaker es una aplicación web ligera diseñada para gestionar intervalos de descanso con precisión. No es solo un cronómetro; es un monitor de hábitos que registra tus excesos y te ayuda a mantener la disciplina en tus tiempos de desconexión.

✨ Características Principales
Gestión Multi-Descanso: Configura hasta 3 tipos de descansos simultáneos (ej: Café, Estiramientos, Comida).

Enfoque Único (Exclusividad): Al iniciar un descanso, los demás se pausan automáticamente para evitar distracciones y errores en el conteo.

Control de Exceso: Visualización en tiempo real del tiempo gastado por encima del objetivo configurado (marcado en rojo).

Historial Detallado: Accede a una vista de auditoría por cada descanso donde verás:

Fecha y hora de creación.

Hora exacta de finalización de cada sesión.

Comparativa: Tiempo Objetivo vs. Tiempo Gastado.

Cálculo de exceso por sesión.

Estados Visuales Inteligentes:

Verde: En marcha.

Gris con Pulso: Pausado con tiempo acumulado (interrumpido).

Gris Sólido: Detenido o finalizado.

Persistencia Local: Todos tus datos y configuraciones se guardan en el localStorage de tu navegador.

🚀 Tecnologías Utilizadas
HTML5 & CSS3 (Estructura y Estilos)

Tailwind CSS 3.0

JavaScript (Vanilla ES6+) (Lógica de estados y persistencia)

🛠️ Instalación
Clona este repositorio:

Bash
git clone https://github.com/tu-usuario/break-master-pro.git
Abre el archivo index.html en tu navegador favorito.

¡Empieza a gestionar tus descansos!

📖 Cómo funciona la lógica de estados
La aplicación utiliza una máquina de estados para garantizar la coherencia visual:

Running: El cronómetro suma segundos. Otros cronómetros activos pasan a Paused.

Paused: La animación de pulso se activa solo si el cronómetro tiene progreso acumulado.

Stopped: El cronómetro vuelve a cero y se guarda la sesión en el historial si se completó.

Desarrollado con ❤️ para mejorar la productividad y el bienestar.
