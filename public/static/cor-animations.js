
window.addEventListener('load', function() {
    const canvas = document.getElementById('profile-canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    class Particle {
        constructor(effect, x, y, color) {
            this.effect = effect
            this.x = x;
            this.y = y;
            this.originX = Math.floor(x);
            this.originY = Math.floor(y);
            this.color = color;
            this.size = this.effect.gap;
            this.vx = 0;
            this.vy = 0;
            this.ease = 0.02;
            this.forceMod = 0.08;
            this.friction = 0.97;
            this.dx = 0;
            this.dy = 0;
            this.distance = 0;
            this.force = 0;
            this.angle = 0;
        }
        draw(context) {
            context.fillStyle = this.color
            context.fillRect(this.x, this.y, this.size, this.size)
        }
        update(distance) {
            this.effect = effect
            this.dx = this.effect.mouse.x - this.x - distance.left;
            this.dy = this.effect.mouse.y - this.y - distance.top;
            this.distance = this.dx * this.dx + this.dy * this.dy;
            this.force = -this.effect.mouse.radius / this.distance;

            if (this.distance < this.effect.mouse.radius) {
                this.angle = Math.atan2(this.dy, this.dx);
                this.vx += this.force * Math.cos(this.angle) * this.forceMod
                this.vy += this.force * Math.sin(this.angle) * this.forceMod
            }

            this.x += (this.vx *= this.friction) + (this.originX - this.x) * this.ease;
            this.y += (this.vy *= this.friction) + (this.originY - this.y) * this.ease;
        }
        warp() {
            this.x = Math.random() * this.effect.width;
            this.y = Math.random() * this.effect.height;
            this.ease = 0.02;
        }
    }

    class Effect {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.particleArray = [];
            this.image = document.getElementById('profile-image');
            this.centerX = this.width * 0.5;
            this.centerY = this.height * 0.5;
            this.x = this.centerX - this.image.width * 0.5
            this.y = 200
            this.gap = 10;
            this.mouse = {
                radius: 2500,
                x: undefined,
                y: undefined
            }
            window.addEventListener('mousemove', event => {
                this.mouse.x = event.x;
                this.mouse.y = event.y;
            });
        }
        init(context) {
            context.drawImage(this.image, this.x, this.y, this.image.width, this.image.height)
            const pixels = context.getImageData(0, 0, this.width, this.height).data;

            for (let row = 0; row < this.height; row += this.gap) {
                for (let col = 0; col < this.width; col += this.gap) {
                    const index = (row * this.width + col) * 4 //4 values per pixel
                    const red = pixels[index];
                    const green = pixels[index + 1];
                    const blue = pixels[index + 2];
                    const alpha = pixels[index + 3];
                    const color = 'rgb(' + red + ',' + green + ',' + blue + ')'
                    if (alpha > 0) {
                        this.particleArray.push(new Particle(this, col, row, color));
                    }
                }
            }
            /*
            for (let i = 0; i < 100; i += 1) {
                this.particleArray.push(new Particle(this))
            }
            */
        }
        draw(context) {
            this.particleArray.forEach(particle => particle.draw(context));
        }
        updateSize(context, width, height) {
            this.particleArray = [];
            this.width = width
            this.height = height
            this.centerX = this.width * 0.5;
            this.centerY = this.height * 0.5;
            this.x = this.centerX - this.image.width * 0.5
            this.y = this.centerY - this.image.height * 0.5
            this.init(context)
        }
        update(distance) {
            this.particleArray.forEach(particle => particle.update(distance));
        }
    }

    const effect = new Effect(canvas.width, canvas.height)
    effect.init(ctx)

    function animate() {
        var scrollTop = $(window).scrollTop(),
            scrollLeft = $(window).scrollLeft(),
            elementOffsetTop = $('#profile-canvas').offset().top,
            elementOffsetLeft = $('#profile-canvas').offset().left,
            distance = { "top": (elementOffsetTop - scrollTop), left: (elementOffsetLeft - scrollLeft) };
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        effect.draw(ctx)
        effect.update(distance)
        requestAnimationFrame(animate)
    }

    animate();

    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        effect.updateSize(ctx, canvas.width, canvas.height)
    });

    /*
        ctx.fillRect(0, 0, 1200, 100)
        ctx.drawImage(image, 0, 0, image.width, image.height)
    */
});

