/**
 * Logika gry "Latające Samoloty"
 */

// --- KONFIGURACJA I ELEMENTY UI ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const UI = {
    mainMenu: document.getElementById('main-menu'),
    hud: document.getElementById('hud'),
    gameOver: document.getElementById('game-over'),
    score: document.getElementById('score'),
    lives: document.getElementById('lives'),
    finalScore: document.getElementById('final-score-value'),
    startBtn: document.getElementById('start-btn'),
    restartBtn: document.getElementById('restart-btn'),
};

let gameState = 'MENU'; // MENU, PLAYING, GAMEOVER
let animationId;
let gameFrame = 0;
let score = 0;
let lives = 3;

// Zmienne do płynnego dostosowywania rozmiaru okna
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// --- STEROWANIE KLAWIATURĄ ---
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    a: false,
    s: false,
    d: false,
    ' ': false // Spacja
};

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false;
});

// --- KLASY OBIEKTÓW GRY ---

class Background {
    constructor() {
        this.stars = [];
        this.initStars();
    }

    initStars() {
        for(let i=0; i<100; i++) {
            this.stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 3 + 0.5,
                alpha: Math.random()
            });
        }
    }

    update() {
        if (gameState !== 'PLAYING') return;
        this.stars.forEach(star => {
            star.x -= star.speed;
            if (star.x < 0) {
                star.x = canvas.width;
                star.y = Math.random() * canvas.height;
            }
        });
    }

    draw(ctx) {
        // Tło gradientowe jest aplikowane przez CSS, płótno czyścimy transparentnie w pętli.
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.stars.forEach(star => {
            ctx.globalAlpha = star.alpha;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
    }
}

class Player {
    constructor() {
        this.width = 60;
        this.height = 40;
        this.x = 100;
        this.y = canvas.height / 2;
        this.speed = 8;
        this.color = '#00f2fe';
        this.shootTimer = 0;
        this.shootInterval = 15; // Klatki pomiędzy strzałami
        this.vy = 0;
        this.vx = 0;
    }

    update() {
        // Ruch pionowy
        if (keys.ArrowUp || keys.w) this.vy = -this.speed;
        else if (keys.ArrowDown || keys.s) this.vy = this.speed;
        else this.vy *= 0.8; // Tarcie

        // Ruch poziomy
        if (keys.ArrowLeft || keys.a) this.vx = -this.speed;
        else if (keys.ArrowRight || keys.d) this.vx = this.speed;
        else this.vx *= 0.8;

        this.y += this.vy;
        this.x += this.vx;

        // Ograniczenia ekranu
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > canvas.height) this.y = canvas.height - this.height;
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width / 2) this.x = canvas.width / 2; // Ogranicz do połowy ekranu

        // Strzelanie
        if (keys[' '] && this.shootTimer >= this.shootInterval) {
            projectiles.push(new Projectile(this.x + this.width, this.y + this.height / 2));
            this.shootTimer = 0;
            // Odrzut wizualny (recoil)
            this.x -= 5;
        }
        this.shootTimer++;
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        // Rysowanie samolotu jako grota strzały/myśliwca
        ctx.beginPath();
        ctx.moveTo(this.x + this.width, this.y + this.height / 2);
        ctx.lineTo(this.x, this.y);
        ctx.lineTo(this.x + 15, this.y + this.height / 2);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // Ogień z silnika
        if (this.vx >= 0) {
            ctx.fillStyle = '#ffb199';
            ctx.shadowColor = '#ff0844';
            ctx.beginPath();
            ctx.moveTo(this.x + 10, this.y + this.height / 2);
            ctx.lineTo(this.x - Math.random() * 20 - 10, this.y + this.height / 2 - 5);
            ctx.lineTo(this.x - Math.random() * 20 - 10, this.y + this.height / 2 + 5);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 4;
        this.speed = 15;
        this.markedForDeletion = false;
        this.color = '#fff';
    }

    update() {
        this.x += this.speed;
        if (this.x > canvas.width) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#4facfe';
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y - this.height/2, this.width, this.height);
        ctx.restore();
    }
}

class Enemy {
    constructor() {
        this.width = 40 + Math.random() * 30;
        this.height = this.width * 0.8;
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - this.height);
        this.speed = Math.random() * 3 + 3 + (score * 0.05); // Predkosc rosnie wraz ze score
        this.markedForDeletion = false;
        this.color = `hsl(${Math.random() * 60 + 300}, 100%, 60%)`; // Róże i fiolety
        this.hp = Math.ceil(this.width / 20); // Duzi przeciwnicy mają więcej hp
        
        // Unikalny ruch (sinus)
        this.angle = 0;
        this.angleSpeed = Math.random() * 0.1 + 0.05;
        this.curve = Math.random() * 3;
    }

    update() {
        this.x -= this.speed;
        this.y += Math.sin(this.angle) * this.curve;
        this.angle += this.angleSpeed;

        if (this.y < 0) this.y = 0;
        if (this.y + this.height > canvas.height) this.y = canvas.height - this.height;

        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
            // Punkty za zignorowanie wroga? Nie, gracz traci szanse
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        
        // Rysowanie "obcego" statku
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.lineTo(this.x + this.width - 15, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // Pasek HP nad nim jeśli zraniony
        if (this.hp < Math.ceil(this.width / 20)) {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y - 10, this.width, 5);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(this.x, this.y - 10, this.width * (this.hp / Math.ceil(this.width / 20)), 5);
        }

        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 8 + 2;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.color = color;
        this.markedForDeletion = false;
        this.life = 1.0;
        this.decay = Math.random() * 0.05 + 0.02;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.size *= 0.95; // Zmniejszanie się
        this.life -= this.decay;
        if (this.life <= 0 || this.size < 0.5) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// --- GLOBALNE KOLEKCJE ---
let player;
let background;
let projectiles = [];
let enemies = [];
let particles = [];
let enemyTimer = 0;
let enemyInterval = 100; // Co ile klatek spawn

// --- FUNKCJE POMOCNICZE / KOLIZJE ---
function checkCollision(rect1, rect2) {
    // rect1 = obiekt z x, y, width, height (AABB - Axis-Aligned Bounding Box)
    // Nasze statki nie są idealnymi kwadratami, ale uzywamy kwadratow dla "hitboxów" zeby bylo prosciej
    
    // Trochę rygorystyczny hitbox dla wybaczania krawedzi
    const offset = 10;
    
    return (
        rect1.x < rect2.x + rect2.width - offset &&
        rect1.x + rect1.width > rect2.x + offset &&
        rect1.y < rect2.y + rect2.height - offset &&
        rect1.y + rect1.height > rect2.y + offset
    );
}

function createExplosion(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// --- GŁÓWNA PĘTLA GRY ---

function initGame() {
    player = new Player();
    background = new Background();
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    lives = 3;
    gameFrame = 0;
    enemyInterval = 100;
    UI.score.innerText = score;
    UI.lives.innerText = lives;
    
    gameState = 'PLAYING';
    
    // Ukryj wszystko i pokaż HUD
    UI.mainMenu.classList.remove('active');
    UI.gameOver.classList.remove('active');
    UI.hud.classList.add('active');
    
    if (!animationId) {
        animate();
    }
}

function gameOver() {
    gameState = 'GAMEOVER';
    UI.finalScore.innerText = score;
    UI.hud.classList.remove('active');
    UI.gameOver.classList.add('active');
}

function animate() {
    // Czyść płótno, ale zostaw trochę przezroczystości (smugi - motion blur efekt nie polecany dla CSS gradient, więc czyscimy reuglarnie)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    background.update();
    background.draw(ctx);

    if (gameState === 'PLAYING') {
        // Obsługa Gracza
        player.update();
        player.draw(ctx);

        // Obsługa Pocisków
        projectiles.forEach((p, index) => {
            p.update();
            p.draw(ctx);
        });
        projectiles = projectiles.filter(p => !p.markedForDeletion);

        // Obsługa Wrogów
        if (enemyTimer > enemyInterval) {
            enemies.push(new Enemy());
            enemyTimer = 0;
            // Gra robi się trudniejsza z czasem
            if (enemyInterval > 30) enemyInterval -= 1;
        }
        enemyTimer++;

        enemies.forEach((enemy) => {
            enemy.update();
            enemy.draw(ctx);

            // Kolizja z pociskami
            projectiles.forEach((projectile) => {
                if (!projectile.markedForDeletion && !enemy.markedForDeletion) {
                    if (checkCollision(projectile, enemy)) {
                        projectile.markedForDeletion = true;
                        enemy.hp--;
                        createExplosion(projectile.x, projectile.y, '#fff', 5); // Mala iskra

                        if (enemy.hp <= 0) {
                            enemy.markedForDeletion = true;
                            createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.color, 25);
                            score += 10;
                            UI.score.innerText = score;
                        }
                    }
                }
            });

            // Kolizja z graczem
            if (!enemy.markedForDeletion) {
                if (checkCollision(player, enemy)) {
                    enemy.markedForDeletion = true;
                    createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.color, 30);
                    createExplosion(player.x + player.width/2, player.y + player.height/2, player.color, 15); // Cząstki gracza

                    lives--;
                    UI.lives.innerText = lives;
                    
                    // Efekt wstrząsu ekranu (prosty z CSS na cialo html, tutaj pomine żeby zbednie nie zwalniac)
                    
                    if (lives <= 0) {
                        gameOver();
                    } else {
                        // Niewrażliwość? Tutaj uproszczone: odepchnij
                        player.x -= 50;
                    }
                }
            }
        });
        enemies = enemies.filter(enemy => !enemy.markedForDeletion);

        // Obsługa Cząsteczek
        particles.forEach((particle) => {
            particle.update();
            particle.draw(ctx);
        });
        particles = particles.filter(particle => !particle.markedForDeletion);

        gameFrame++;
    } else if (gameState === 'MENU' || gameState === 'GAMEOVER') {
        // Animacje tła trwają w tle? Mozna ale jest to ukryte przez menu
    }
    
    animationId = requestAnimationFrame(animate);
}

// --- ZDARZENIA UI ---
UI.startBtn.addEventListener('click', () => {
    initGame();
});

UI.restartBtn.addEventListener('click', () => {
    initGame();
});

// Wprawienie w ruch tła na starcie
background = new Background();
background.update(); // Update once
background.draw(ctx); // Rysuje tło w głównym menu

// Nie uruchamiam animate() od razu, tylko aby pokazać piękne tło CSS i szkło, czekać ma na start
// Ale możemy chcieć tło w pętli dla gwiazd
animationId = requestAnimationFrame(function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    background.update();
    background.draw(ctx);
    
    // Jeśli nie gra, krec gwiazdkami
    if(gameState !== 'PLAYING') {
       // background animuje się ciągle, więc tutaj jest nadpisywany warunek. Wyłączmy if (gameState !== 'PLAYING') w Background update.
    }
    
    requestAnimationFrame(loop);
});

// Zamiast podwójnej pętli nadpiszemy animationId i włączymy po starcie.
// Ale aby naprawic pętle (dwa razy RAF poszło) nadpiszę to czystym pojedynczym startem.

cancelAnimationFrame(animationId);

// Lepsze podejście startu
function initIdle() {
    background = new Background();
    gameState = 'MENU';
    function idleLoop() {
        if (gameState !== 'PLAYING') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Nadpiszemy update na czas idle zeby lecialo
            background.stars.forEach(star => {
                star.x -= star.speed * 0.5;
                if (star.x < 0) {
                    star.x = canvas.width;
                    star.y = Math.random() * canvas.height;
                }
            });
            background.draw(ctx);
            requestAnimationFrame(idleLoop);
        } else {
             animate(); // Przejdź do pętli gry
        }
    }
    idleLoop();
}

initIdle();
