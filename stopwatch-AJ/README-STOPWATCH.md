Cronómetro y Cuenta atrás — Instrucciones de uso

Resumen
-------
Pequeña aplicación web (HTML + CSS embebido + JavaScript) que incluye dos modos:
- Cronómetro: cuenta hacia arriba (HH:MM:SS)
- Cuenta atrás: introduce un tiempo en formato MM:SS y cuenta hacia abajo hasta 00:00:00

Características principales
-------------------------
- Visualización grande en HH:MM:SS
- Iniciar, Pausar, Reiniciar
- Indicador visual de estado (activo / pausado / inactivo)
- Validación estricta para cuenta atrás (MM:SS con dos dígitos, máximo 99:59)
- Alarma sonora usando Web Audio API al terminar la cuenta atrás
- Botón para silenciar alarmas
- Atajos de teclado: Espacio = iniciar/pausar · R = reiniciar · M = silenciar
- UI responsiva (ajustada para móvil y escritorio)

Archivos principales
--------------------
- `index.html` — página principal con estilo embebido (CSS dentro de <style>)
- `script.js` — lógica completa en JavaScript (comentarios en español)
- `tests/pure.test.js` — tests de funciones puras (msToHHMMSS, parseMMSS)

Cómo usar (rápido)
------------------
1. Abrir `index.html` en un navegador moderno (Chrome, Edge, Firefox o Safari).
   - Desde PowerShell puedes abrirlo con:

```powershell
Start-Process .\index.html
```

2. Selecciona el modo: "Cronómetro" o "Cuenta atrás".
3. En Cuenta atrás, introduce el tiempo en formato `MM:SS` (ej. `05:30`).
   - El botón "Iniciar" se habilita automáticamente si el valor es válido.
4. Usa los botones "Iniciar", "Pausar" y "Reiniciar".
5. Atajos útiles:
   - Espacio: iniciar / pausar
   - R: reiniciar
   - M: silenciar alarma

Notas sobre el audio
--------------------
- La alarma usa la Web Audio API. Algunos navegadores requieren una interacción del usuario con la página
  antes de permitir la reproducción sonora. Si no oyes sonido, haz clic en la página y prueba de nuevo.
- Puedes silenciar la alarma con el botón "Silenciar" o la tecla `M`.

Ejecutar tests unitarios (Node)
-------------------------------
Los tests cubren las funciones puras de conversión y validación.

```powershell
# Desde la carpeta del proyecto
node .\tests\pure.test.js
```

Si el comando devuelve `Resultados: 10 passed, 0 failed` todo está correcto.

Compatibilidad y accesibilidad
-----------------------------
- Diseñada para navegadores modernos.
- Elementos con roles ARIA y texto en español para lectores de pantalla.
- Contraste de colores alto y atajos de teclado para accesibilidad.

Resolución de problemas
-----------------------
- El botón "Iniciar" no se habilita:
  - Asegúrate de usar formato `MM:SS` con dos dígitos para minutos y segundos (ej. `05:30`).
- No se oye la alarma:
  - Interactúa con la página antes (clic o pulsar una tecla) y vuelve a intentarlo.
  - Verifica si está activado el botón "Silenciar".
- Página sin estilo aparente:
  - Asegúrate de abrir `index.html` desde la carpeta correcta; el CSS está embebido dentro del HTML.

Posibles ampliaciones
---------------------
- Guardado/exportación de sesiones (CSV)
- Notificaciones del sistema (Web Notifications)
- Tema claro/oscuro

Contacto
--------
Si quieres que integre alguna mejora (exportar sesiones, pruebas UI automatizadas, más alarmas, etc.), dime y lo implemento.

Licencia
--------
Código entregado sin licencia explícita — úsalo libremente para aprendizaje o proyectos privados. Si necesitas
una licencia formal (MIT, Apache, GPL) dime cuál prefieres y la añado.
