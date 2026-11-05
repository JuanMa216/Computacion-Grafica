let d = document.getElementById('dibujo');
let lienzo = d.getContext('2d');

lienzo.beginPath();

const centroX = d.width / 3;
const centroY = d.height / 3;
const radio = 125;

lienzo.arc(centroX, centroY, radio, 0, 2*Math.PI);
lienzo.strokeStyle = 'green';
lienzo.lineWidth = 2;
lienzo.stroke();

lienzo.beginPath();

const centroX2 = d.width / 1.5;
const centroY2 = d.height / 3;
const radio2 = 125;

lienzo.arc(centroX2, centroY2, radio2, 0, 2*Math.PI);
lienzo.strokeStyle = 'blue';
lienzo.lineWidth = 2;
lienzo.stroke();

lienzo.beginPath();

const centroX3 = d.width / 2;
const centroY3 = d.height / 1.5;
const radio3 = 125;

lienzo.arc(centroX3, centroY3, radio3, 0, 2*Math.PI);
lienzo.strokeStyle = 'red';
lienzo.lineWidth = 2;
lienzo.stroke();