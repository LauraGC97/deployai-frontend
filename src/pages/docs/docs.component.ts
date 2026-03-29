import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docs.component.html',
  styleUrl: './docs.component.css'
})
export class DocsComponent {

  private readonly router = inject(Router);

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // Sección activa del sidebar
  activeSection = signal<string>('installation');
  sidebarOpen = signal<boolean>(false);
  toggleDocsSidebar(): void { this.sidebarOpen.update(v => !v); }
  closeDocsSidebar(): void  { this.sidebarOpen.set(false); }

  sections = [
    { id: 'installation', label: '// instalación',  icon: '⚙️' },
    { id: 'modes',        label: '// modos',         icon: '⚡' },
    { id: 'chat',         label: '// uso del chat',  icon: '💬' },
    { id: 'api',          label: '// referencia API', icon: '🔌' },
  ];

  setSection(id: string): void {
    this.activeSection.set(id);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  goToChat(): void {
    this.router.navigate(['/chat']);
  }
}