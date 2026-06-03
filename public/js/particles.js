// 粒子效果

const Particles = {
  canvas: null,
  ctx: null,
  particles: [],
  animationId: null,
  mouseX: 0,
  mouseY: 0,

  init() {
    this.canvas = document.getElementById('particles');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.createParticles();
    this.bindEvents();
    this.animate();
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  createParticles() {
    const count = Math.min(80, Math.floor(window.innerWidth / 20));
    this.particles = [];

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        color: this.getRandomColor()
      });
    }
  },

  getRandomColor() {
    const colors = [
      '102, 126, 234',  // 蓝紫
      '118, 75, 162',   // 紫色
      '240, 147, 251',  // 粉色
      '245, 87, 108',   // 红粉
      '67, 97, 238',    // 蓝色
      '79, 172, 254',   // 天蓝
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  },

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.createParticles();
    });

    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
  },

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach(particle => {
      // 更新位置
      particle.x += particle.speedX;
      particle.y += particle.speedY;

      // 鼠标交互
      const dx = this.mouseX - particle.x;
      const dy = this.mouseY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 150) {
        const force = (150 - distance) / 150;
        particle.x -= dx * force * 0.01;
        particle.y -= dy * force * 0.01;
      }

      // 边界检测
      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvas.height;
      if (particle.y > this.canvas.height) particle.y = 0;

      // 绘制粒子
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${particle.color}, ${particle.opacity})`;
      this.ctx.fill();
    });

    // 绘制连线
    this.drawLines();

    this.animationId = requestAnimationFrame(() => this.animate());
  },

  drawLines() {
    const maxDistance = 120;

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance) {
          const opacity = (1 - distance / maxDistance) * 0.2;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.strokeStyle = `rgba(102, 126, 234, ${opacity})`;
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
        }
      }
    }
  },

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
};

// 导出粒子模块
window.Particles = Particles;
