import { Component, signal, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements AfterViewInit {

  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  menuOpen = false;
  toggleMenu() { this.menuOpen = !this.menuOpen; }
  closeMenu()  { this.menuOpen = false; }
  scrollTo(sectionId: string): void {
  this.closeMenu();
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

  goToAuth(): void {
    this.router.navigate(['/auth']);
  }

  getUserInitials(): string {
    const name = this.authService.currentUser()?.name ?? '';
    return name
      .split(' ')
      .map((w: string) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  goToChat(): void {
    this.router.navigate(['/chat']);
  }

  goToDocs(): void {
  this.router.navigate(['/docs']);
  }

  @ViewChild('bgCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit() {
    this.initBackground();
  }

  private initBackground() {
    const canvas = this.canvasRef.nativeElement;
    const ctx    = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const snippets = [
      'const', 'let', 'function', 'return', 'if', 'else',
      'for', 'while', 'import', 'export', 'async', 'await',
      'class', '=>', '{}', '[]', '()', '&&', '||', '===',
      'deploy()', 'AI.optimize()', 'autoScale', 'git push',
      'npm run', '#00E5FF', '#BF5AF2', 'v2.0', 'true',
      'false', 'null', '200 OK', '404', 'git commit',
      'npm install', 'build', 'run dev'
    ];

    const COLORS = ['#00E5FF', '#BF5AF2', '#FFE033', '#32D74B', '#FF9F40'];
    const isMobile   = window.innerWidth < 640;
    const PART_COUNT = isMobile ? 28 : 55;

    const particles = Array.from({ length: PART_COUNT }, () => ({
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      vy:   -(0.15 + Math.random() * 0.4),
      vx:    (Math.random() - 0.5) * 0.2,
      text:  snippets[Math.floor(Math.random() * snippets.length)],
      alpha: 0.03 + Math.random() * 0.065,
      size:  isMobile ? 9 + Math.random() * 3 : 10 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    }));

    const allWaves = [
      { amp: 45, freq: 0.007, speed: 0.0035, yRatio: 0.28, color: 'rgba(0,229,255,0.045)',  phase: 0   },
      { amp: 60, freq: 0.005, speed: 0.0025, yRatio: 0.50, color: 'rgba(191,90,242,0.035)', phase: 2.1 },
      { amp: 35, freq: 0.011, speed: 0.005,  yRatio: 0.70, color: 'rgba(50,215,75,0.03)',   phase: 4.2 },
      { amp: 50, freq: 0.006, speed: 0.002,  yRatio: 0.85, color: 'rgba(255,224,51,0.025)', phase: 1.5 },
    ];
    const waves = isMobile ? allWaves.slice(0, 2) : allWaves;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      waves.forEach(w => {
        w.phase += w.speed;
        ctx.beginPath();
        ctx.strokeStyle = w.color;
        ctx.lineWidth   = 1.5;
        const baseY = canvas.height * w.yRatio;
        for (let x = 0; x <= canvas.width; x += 3) {
          const y = baseY + Math.sin(x * w.freq + w.phase) * w.amp;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      particles.forEach(p => {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle   = p.color;
        ctx.font        = `${p.size}px 'JetBrains Mono', monospace`;
        ctx.fillText(p.text, p.x, p.y);
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -30) {
          p.y    = canvas.height + 20;
          p.x    = Math.random() * canvas.width;
          p.text = snippets[Math.floor(Math.random() * snippets.length)];
        }
        if (p.x < -120)               p.x = canvas.width + 10;
        if (p.x > canvas.width + 120) p.x = -10;
      });

      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    };

    draw();
  }
}