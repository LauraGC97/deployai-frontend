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

  @ViewChild('bgCanvas') bgCanvas!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit() {
    setTimeout(() => this.initBackground(), 0);
  }

  private initBackground(): void {
  const canvas = this.bgCanvas.nativeElement;
  const ctx    = canvas.getContext('2d')!;

  const resize = () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const SYMBOLS = '01</>{}[]();=+*&|=>const let fn'.split('');

  const streams = Array.from({ length: 30 }, () => ({
    x:       Math.random() * window.innerWidth,
    y:       Math.random() * -600,
    speed:   0.3 + Math.random() * 0.5,
    chars:   Array.from({ length: 16 }, () =>
               SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]),
    timer:   0,
    color:   [[34,211,238],[168,85,247],[16,185,129]][Math.floor(Math.random() * 3)],
    opacity: 0.05 + Math.random() * 0.07,
  }));

  const waves = [
    { y: 0.25, amp: 20, freq: 0.007, speed: 0.004, color: [34,211,238],  alpha: 0.06 },
    { y: 0.50, amp: 28, freq: 0.005, speed: 0.003, color: [168,85,247],  alpha: 0.05 },
    { y: 0.72, amp: 16, freq: 0.010, speed: 0.005, color: [16,185,129],  alpha: 0.04 },
    { y: 0.88, amp: 22, freq: 0.006, speed: 0.002, color: [253,224,71],  alpha: 0.03 },
  ];

  let t = 0;

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ── ONDAS ──
    waves.forEach(w => {
      const [r, g, b] = w.color;
      const cy = canvas.height * w.y;

      ctx.beginPath();
      for (let x = 0; x <= canvas.width; x += 2) {
        const y = cy
          + Math.sin(x * w.freq + t * w.speed * 100) * w.amp
          + Math.sin(x * w.freq * 0.5 - t * w.speed * 60) * w.amp * 0.4;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${r},${g},${b},${w.alpha})`;
      ctx.lineWidth   = 1.2;
      ctx.stroke();

      // Brillo bajo la ola
      const grad = ctx.createLinearGradient(0, cy - w.amp, 0, cy + w.amp * 3);
      grad.addColorStop(0, `rgba(${r},${g},${b},${w.alpha * 0.35})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

      ctx.beginPath();
      for (let x = 0; x <= canvas.width; x += 2) {
        const y = cy
          + Math.sin(x * w.freq + t * w.speed * 100) * w.amp
          + Math.sin(x * w.freq * 0.5 - t * w.speed * 60) * w.amp * 0.4;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, cy + w.amp * 4);
      ctx.lineTo(0, cy + w.amp * 4);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    });

    // ── STREAMS DE CÓDIGO ──
    ctx.font = '11px JetBrains Mono, monospace';
    streams.forEach(s => {
      s.y += s.speed;
      if (s.y > canvas.height + 300) {
        s.y     = -200 - Math.random() * 400;
        s.x     = Math.random() * canvas.width;
        s.chars = s.chars.map(() =>
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      }

      s.timer++;
      if (s.timer % 25 === 0) {
        const idx    = Math.floor(Math.random() * s.chars.length);
        s.chars[idx] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      }

      const [r, g, b] = s.color;
      s.chars.forEach((ch, i) => {
        const cy    = s.y + i * 15;
        const fade  = Math.max(0, 1 - i / s.chars.length);
        const alpha = s.opacity * fade;
        if (alpha < 0.004) return;

        const bright = i === 0 ? Math.min(alpha * 2.5, 0.3) : alpha;
        ctx.fillStyle = `rgba(${r},${g},${b},${bright})`;
        ctx.fillText(ch, s.x, cy);
      });
    });

    t += 0.016;
    requestAnimationFrame(draw);
  };

    draw();
  }
}  