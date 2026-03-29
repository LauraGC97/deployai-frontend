import { Injectable } from '@angular/core';
import { marked, Renderer } from 'marked';
import hljs from 'highlight.js';

@Injectable({ providedIn: 'root' })
export class MarkdownService {

  constructor() {
    const renderer = new Renderer();

    renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
      const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
      const highlighted = hljs.highlight(text, { language }).value;

      return `
        <div class="code-block-wrapper">
          <div class="code-block-header">
            <span class="code-lang">${language}</span>
            <button class="copy-btn">
              <span class="copy-icon">⎘</span>
              <span class="copy-label">Copiar</span>
            </button>
          </div>
          <pre><code class="hljs language-${language}">${highlighted}</code></pre>
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