import { Injectable } from '@angular/core';
import { marked, Renderer } from 'marked';

@Injectable({ providedIn: 'root' })
export class MarkdownService {

  constructor() {
    const renderer = new Renderer();

    // Sobreescribe el renderizado de bloques de código
    renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
      const language = lang ?? 'code';
      const escaped  = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      return `
        <div class="code-block-wrapper">
          <div class="code-block-header">
            <span class="code-lang">${language}</span>
            <button class="copy-btn" onclick="copyCode(this)">
              <span class="copy-icon">⎘</span>
              <span class="copy-label">Copiar</span>
            </button>
          </div>
          <pre><code class="language-${language}">${escaped}</code></pre>
        </div>
      `;
    };

    marked.use({ renderer });
    marked.setOptions({ breaks: true, gfm: true });
  }

  parse(text: string): string {
    return marked.parse(text) as string;
  }
}