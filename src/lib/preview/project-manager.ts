import { GeneratedProject, ProjectFile } from '../../types';

export class WebsiteBuilder {
  /**
   * Determine if user prompt is asking to build or modify a website/web page/app
   */
  static isWebsiteRequest(prompt: string): boolean {
    const p = prompt.toLowerCase();
    const triggerPhrases = [
      'build me a website',
      'create a website',
      'build a website',
      'make a website',
      'build a landing page',
      'create a landing page',
      'make a landing page',
      'build me a portfolio',
      'create a portfolio website',
      'build a calculator',
      'build a dashboard',
      'generate a website',
      'make a web app',
      'build an app with preview',
      'create an interactive website',
      'build a restaurant website',
    ];

    if (triggerPhrases.some((phrase) => p.includes(phrase))) {
      return true;
    }

    // Secondary checks for strong website intent
    const hasBuildVerb = p.includes('build') || p.includes('create') || p.includes('make') || p.includes('design');
    const hasWebNoun = p.includes('website') || p.includes('webpage') || p.includes('landing page') || p.includes('portfolio site');
    return hasBuildVerb && hasWebNoun;
  }

  /**
   * Determine if prompt is an iteration on an existing website
   */
  static isIterationRequest(prompt: string, hasExistingProject: boolean): boolean {
    if (!hasExistingProject) return false;
    const p = prompt.toLowerCase();
    const iterationKeywords = [
      'change the', 'make the', 'add a', 'update the', 'remove the',
      'color', 'button', 'navbar', 'hero', 'footer', 'styling', 'dark mode',
      'pricing section', 'contact form', 'typography', 'background', 'fix the'
    ];
    return iterationKeywords.some((k) => p.includes(k));
  }

  /**
   * Formats prompt for model to return structured website project code
   */
  static formatGenerationPrompt(userPrompt: string, existingProject?: GeneratedProject | null): string {
    if (existingProject) {
      const existingFilesSummary = existingProject.files.map((f) => `=== FILE: ${f.path} ===\n${f.content}`).join('\n\n');

      return `You are ROSE Website Builder Engine.
The user wants to iterate on an existing website project.

EXISTING FILES:
${existingFilesSummary}

USER REQUEST:
"${userPrompt}"

RULES:
1. Update, refine, or add files to satisfy the request.
2. Provide self-contained, complete HTML/CSS/JavaScript with modern Tailwind CSS (via CDN: https://cdn.tailwindcss.com) and Lucide icons (via unpkg or lucide script if needed) or native SVG icons.
3. Every button, interaction, state, and form MUST be functional and visually stunning.
4. Output your response as clean, fenced file blocks using the format:
\`\`\`html:index.html
<!DOCTYPE html>
...
\`\`\`
or for other files:
\`\`\`css:styles.css
...
\`\`\`
Always ensure index.html is complete and ready to render in an isolated sandboxed iframe.`;
    }

    return `You are ROSE Website Builder Engine.
The user has requested to build a website:
"${userPrompt}"

RULES:
1. Build a complete, production-ready, beautiful, responsive single-page or multi-section website.
2. Include modern Tailwind CSS (via CDN: <script src="https://cdn.tailwindcss.com"></script>), Google Fonts (Inter, Plus Jakarta Sans, etc.), and clean responsive components.
3. Include functional interactivity (e.g., interactive calculators, filtering, modals, smooth tab switching, responsive mobile menus, themes, or forms).
4. Output the code inside a fenced code block with the filename:
\`\`\`html:index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Website</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 text-gray-900 min-h-screen">
  ...
</body>
</html>
\`\`\`
Ensure the generated code is 100% complete and self-contained with no omitted snippets.`;
  }

  /**
   * Parse fenced code blocks from model response into ProjectFile array
   */
  static parseProjectFiles(responseText: string): ProjectFile[] {
    const files: ProjectFile[] = [];
    // Matches ```language:filepath or ```filepath or ```language with filepath on first line
    const regex = /```(?:[a-zA-Z0-9_-]+:)?([a-zA-Z0-9_./-]+\.[a-zA-Z0-9]+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(responseText)) !== null) {
      let filePath = match[1] || 'index.html';
      const content = match[2].trim();

      // Normalize filePath
      if (filePath.includes(':')) {
        filePath = filePath.split(':')[1];
      }
      if (!filePath.includes('.')) {
        filePath = 'index.html';
      }

      files.push({
        path: filePath,
        content,
      });
    }

    // Fallback: If no fenced files were captured with filename, extract any html codeblock
    if (files.length === 0) {
      const htmlBlockMatch = responseText.match(/```html\n([\s\S]*?)```/);
      if (htmlBlockMatch && htmlBlockMatch[1]) {
        files.push({
          path: 'index.html',
          content: htmlBlockMatch[1].trim(),
        });
      }
    }

    return files;
  }

  /**
   * Generates a safe, isolated srcdoc HTML for iframe rendering
   */
  static generateSandboxHtml(files: ProjectFile[]): string {
    const indexFile = files.find((f) => f.path === 'index.html' || f.path.endsWith('.html')) || files[0];
    if (!indexFile) {
      return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;text-align:center;color:#6b7280;"><h3>Preview not ready yet</h3></body></html>`;
    }

    let html = indexFile.content;

    // Inject any auxiliary CSS or JS files if defined separately
    const cssFiles = files.filter((f) => f.path.endsWith('.css'));
    const jsFiles = files.filter((f) => f.path.endsWith('.js'));

    let injectedHead = '';
    cssFiles.forEach((css) => {
      injectedHead += `<style>${css.content}</style>\n`;
    });

    let injectedBody = '';
    jsFiles.forEach((js) => {
      injectedBody += `<script>${js.content}</script>\n`;
    });

    if (injectedHead) {
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${injectedHead}</head>`);
      } else {
        html = `<head>${injectedHead}</head>` + html;
      }
    }

    if (injectedBody) {
      if (html.includes('</body>')) {
        html = html.replace('</body>', `${injectedBody}</body>`);
      } else {
        html = html + injectedBody;
      }
    }

    return html;
  }
}
