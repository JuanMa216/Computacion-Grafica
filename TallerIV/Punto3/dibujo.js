let d = document.getElementById('dibujo');
let lienzo = d.getContext("2d");

// Triangulo
lienzo.beginPath();
lienzo.strokeStyle = 'red';

lienzo.moveTo(200, 100);
lienzo.lineTo(100, 250);
lienzo.lineTo(300, 250);
lienzo.lineTo(200, 100);

lienzo.stroke();


// Rectangulo
lienzo.beginPath();
lienzo.strokeStyle = 'blue';

lienzo.moveTo(400, 100);
lienzo.lineTo(650, 100);
lienzo.lineTo(650, 250);
lienzo.lineTo(400, 250);
lienzo.lineTo(400, 100);

lienzo.stroke();


// trapecio
lienzo.beginPath();
lienzo.strokeStyle = 'green';

lienzo.moveTo(100, 350);
lienzo.lineTo(350, 350);
lienzo.lineTo(400, 500);
lienzo.lineTo(50, 500);
lienzo.lineTo(100, 350);

lienzo.stroke();


// Hexagono
lienzo.beginPath();
lienzo.strokeStyle = 'purple';

lienzo.moveTo(500, 330);
lienzo.lineTo(600, 330);
lienzo.lineTo(650, 415);
lienzo.lineTo(600, 500);
lienzo.lineTo(500, 500);
lienzo.lineTo(450, 415);
lienzo.lineTo(500, 330);

lienzo.stroke();