
let d = document.getElementById('dibujo');
let lienzo = d.getContext("2d");

// Limpiar el lienzo
lienzo.clearRect(0, 0, 800, 600);


// 1. fillRect(): rectángulo relleno
lienzo.fillStyle = 'lightblue';
lienzo.fillRect(50, 50, 150, 80);


// 2. strokeRect(): rectángulo con contorno
lienzo.strokeStyle = 'red';
lienzo.lineWidth = 3;
lienzo.strokeRect(250, 50, 150, 80);


// 3. arc() y fill(): círculo relleno
lienzo.beginPath();
lienzo.arc(550, 90, 45, 0, 2 * Math.PI);
lienzo.fillStyle = 'orange';
lienzo.fill();


// 4. arc() y stroke(): círculo sin relleno
lienzo.beginPath();
lienzo.arc(700, 90, 45, 0, 2 * Math.PI);
lienzo.strokeStyle = 'purple';
lienzo.stroke();


// 5. quadraticCurveTo(): curva
lienzo.beginPath();
lienzo.moveTo(50, 250);
lienzo.quadraticCurveTo(150, 150, 250, 250);
lienzo.strokeStyle = 'green';
lienzo.lineWidth = 3;
lienzo.stroke();


// 6. setLineDash(): línea discontinua
lienzo.beginPath();
lienzo.setLineDash([10, 5]);
lienzo.moveTo(300, 220);
lienzo.lineTo(500, 220);
lienzo.strokeStyle = 'blue';
lienzo.stroke();

// Restaurar línea continua
lienzo.setLineDash([]);


// 7. fillText(): texto relleno
lienzo.font = '25px Arial';
lienzo.fillStyle = 'darkblue';
lienzo.fillText('Canvas JavaScript', 50, 350);


// 8. strokeText(): texto con contorno
lienzo.font = '30px Arial';
lienzo.strokeStyle = 'red';
lienzo.strokeText('HTML5', 50, 420);


// 9. globalAlpha: transparencia
lienzo.globalAlpha = 0.5;

lienzo.fillStyle = 'red';
lienzo.fillRect(350, 300, 100, 100);

lienzo.fillStyle = 'blue';
lienzo.fillRect(400, 350, 100, 100);

// Restaurar opacidad
lienzo.globalAlpha = 1;
