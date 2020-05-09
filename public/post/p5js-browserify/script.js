const totals = 100;
const limitMin = 15;
const limitMax = 150;
const speedMin = 0.5;
const speedMax = 5;

let x = new Array();
let y = new Array();
let speed = new Array();
let particleX = new Array();
let limit = new Array();
let showBackground = true;
let example;

const sketch = function(p5) {
    p5.setup =  function() {
        example = document.getElementById("p5js-example");
        example.style.height = `${example.clientWidth}px`;
        const canvas = p5.createCanvas(example.clientWidth, example.clientHeight);
        canvas.parent('p5js-example');
        canvas.position(0, 0);
        canvas.style('z-index', '0');

        fillArrays();
    }

    p5.draw =  function() {
        if(p5.random(100) > 80) {
            showBackground = !showBackground;
        }
        if(showBackground) {
            p5.background(0);
        } 
        showSystem();
    }

    function fillArrays() {
        for(let i = 0; i < totals; i++) {
            x[i] = p5.random(example.clientWidth);
            y[i] = p5.random(example.clientHeight);
            speed[i] = p5.random(speedMin, speedMax);
            limit[i] = p5.random(limitMin, limitMax);
            particleX[i] = 0.0;
        }
    }

    function showSystem() {
        for(let i = 0; i < totals; i++) {
            p5.stroke(255);
            p5.line(x[i], y[i], x[i]+limit[i], y[i]);

            particleX[i] += speed[i];

            p5.fill(255);
            p5.ellipse(x[i]+particleX[i], y[i], 5, 5);

            if(particleX[i] > limit[i]) {
                x[i] = p5.random(example.clientWidth);
                y[i] = p5.random(example.clientHeight);
                speed[i] = p5.random(speedMin, speedMax);
                limit[i] = p5.random(limitMin, limitMax);
                particleX[i] = 0.0;
            }

            if(i > 0) {
                p5.line(x[i]+ particleX[i], y[i], x[i-1] + particleX[i-1], y[i-1]);
            }
        }
    }
}

new p5(sketch)
