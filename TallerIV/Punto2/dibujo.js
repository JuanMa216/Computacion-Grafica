let d = document.getElementById('dibujo');
let lienzo = d.getContext("2d");

lienzo.beginPath();
lienzo.moveTo(100, 400);
lienzo.lineTo(700, 400);
lienzo.strokeStyle = 'red';
lienzo.stroke();

lienzo.beginPath();
lienzo.strokeStyle = 'black';
lienzo.moveTo(400, 400);
lienzo.lineTo(400, 300);


lienzo.moveTo(400, 400);
lienzo.lineTo(700, 300);

lienzo.lineTo(700, 200);


lienzo.moveTo(400, 400);
lienzo.lineTo(100, 300);

lienzo.lineTo(100, 200);

lienzo.lineTo(400, 300);

lienzo.lineTo(700, 200);

lienzo.lineTo(400, 100);

lienzo.lineTo(100, 200);
lienzo.stroke();

lienzo.beginPath();
lienzo.strokeStyle = 'black';

lienzo.moveTo(160, 200);
lienzo.lineTo(400, 120);

lienzo.lineTo(640, 200);

lienzo.lineTo(400, 285);

lienzo.lineTo(160, 200);


lienzo.moveTo(400, 120);
lienzo.lineTo(400, 285);


lienzo.stroke();


