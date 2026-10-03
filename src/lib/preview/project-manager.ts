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
      'pomodoro timer',
      'coffee roastery',
      'snake game',
      'todo app',
      'build a tool',
      'create a tool',
      'make a tool',
      'build a game',
      'create a game',
      'make a game',
    ];

    if (triggerPhrases.some((phrase) => p.includes(phrase))) {
      return true;
    }

    // Secondary checks for strong website intent
    const hasBuildVerb = p.includes('build') || p.includes('create') || p.includes('make') || p.includes('design') || p.includes('code');
    const hasWebNoun =
      p.includes('website') ||
      p.includes('webpage') ||
      p.includes('web page') ||
      p.includes('landing page') ||
      p.includes('portfolio') ||
      p.includes('web app') ||
      p.includes('dashboard') ||
      p.includes('calculator') ||
      p.includes('timer') ||
      p.includes('todo') ||
      p.includes('game');
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

      return `You are DRIVEcode Website Builder Engine.
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

    return `You are DRIVEcode Website Builder Engine.
The user has requested to build a website:
"${userPrompt}"

CRITICAL OUTPUT RULES:
1. You MUST start your response IMMEDIATELY on line 1 with:
\`\`\`html:index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Website Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
  </style>
</head>
<body class="bg-black text-white min-h-screen antialiased">
  ...
  <script>lucide.createIcons();</script>
</body>
</html>
\`\`\`
2. DO NOT write markdown summaries, explanations, aspect lists, comparison tables, or commentary outside of the code block.
3. Every button, interaction, state, and form MUST be functional and visually stunning.
4. If the user asks for a specific section (e.g. "hero section", "pricing table", "portfolio header"), wrap it in a complete, gorgeous full-page preview with background effects, navigation, and interactive buttons so it displays immediately in the live browser preview.
5. Output 100% complete, production-ready code with no placeholders or omitted snippets.`;
  }

  /**
   * Parse fenced code blocks from model response into ProjectFile array
   */
  static parseProjectFiles(responseText: string): ProjectFile[] {
    const files: ProjectFile[] = [];

    // Match all fenced blocks: ```html:index.html or ```html or ```css:styles.css
    const codeBlockRegex = /```([a-zA-Z0-9_.-]+)?(?::([a-zA-Z0-9_./-]+))?\s*\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(responseText)) !== null) {
      const lang = (match[1] || '').toLowerCase().trim();
      let filePath = (match[2] || '').trim();
      const content = match[3].trim();

      if (!content) continue;

      const hasHtmlTags =
        content.includes('<!DOCTYPE') ||
        content.includes('<html') ||
        content.includes('<body') ||
        content.includes('<section') ||
        content.includes('<div') ||
        content.includes('<header') ||
        content.includes('<main');

      let cleanContent = content;
      // Strip any trailing markdown notes/tables accidentally appended after HTML closing tags
      const lowerContent = cleanContent.toLowerCase();
      const endHtmlTag = lowerContent.lastIndexOf('</html>');
      if (endHtmlTag !== -1 && endHtmlTag + 7 < cleanContent.length) {
        const trailing = cleanContent.slice(endHtmlTag + 7).trim();
        if (trailing.startsWith('#') || trailing.startsWith('---') || trailing.startsWith('|') || trailing.startsWith('**')) {
          cleanContent = cleanContent.slice(0, endHtmlTag + 7);
        }
      } else {
        const endSectionTag = lowerContent.lastIndexOf('</section>');
        if (endSectionTag !== -1 && endSectionTag + 10 < cleanContent.length) {
          const trailing = cleanContent.slice(endSectionTag + 10).trim();
          if (trailing.startsWith('#') || trailing.startsWith('---') || trailing.startsWith('|') || trailing.startsWith('**')) {
            cleanContent = cleanContent.slice(0, endSectionTag + 10);
          }
        }
      }

      if (!filePath) {
        if (lang === 'html' || lang === 'htm' || hasHtmlTags) {
          filePath = 'index.html';
        } else if (lang === 'css' || lang === 'style') {
          filePath = 'styles.css';
        } else if (lang === 'javascript' || lang === 'js' || lang === 'ts' || lang === 'typescript') {
          filePath = 'script.js';
        } else {
          filePath = 'README.md';
        }
      }

      // Safety: If named index.html but contains NO HTML markup and is markdown table/notes, demote to README.md
      if ((filePath === 'index.html' || filePath.endsWith('.html')) && !hasHtmlTags) {
        filePath = 'README.md';
      }

      files.push({ path: filePath, content: cleanContent });
    }

    // Fallback 1: If no valid HTML file was extracted from fences, look for raw HTML anywhere in the response
    const hasValidHtml = files.some(
      (f) =>
        (f.path === 'index.html' || f.path.endsWith('.html')) &&
        f.content.includes('<') &&
        (f.content.includes('<html') ||
          f.content.includes('<!DOCTYPE') ||
          f.content.includes('<div') ||
          f.content.includes('<section') ||
          f.content.includes('<body') ||
          f.content.includes('<header'))
    );

    if (!hasValidHtml) {
      const lower = responseText.toLowerCase();
      const doctypeIdx = lower.indexOf('<!doctype html');
      const htmlIdx = lower.indexOf('<html');
      const sectionIdx = lower.indexOf('<section');
      const divIdx = lower.indexOf('<div');

      const candidates = [doctypeIdx, htmlIdx, sectionIdx, divIdx].filter((idx) => idx !== -1);
      if (candidates.length > 0) {
        const startIdx = Math.min(...candidates);
        const endHtml = lower.lastIndexOf('</html>');
        let rawContent = '';
        if (endHtml !== -1) {
          rawContent = responseText.slice(startIdx, endHtml + 7);
        } else {
          const sectionEnd = lower.lastIndexOf('</section>');
          const mainEnd = lower.lastIndexOf('</main>');
          const closingIdx = Math.max(sectionEnd !== -1 ? sectionEnd + 10 : -1, mainEnd !== -1 ? mainEnd + 7 : -1);
          if (closingIdx !== -1) {
            rawContent = responseText.slice(startIdx, closingIdx);
          } else {
            const tail = responseText.slice(startIdx);
            const markdownDividerIdx = tail.search(/\n\s*---\s*\n|\n\s*##\s+/);
            rawContent = markdownDividerIdx !== -1 ? tail.slice(0, markdownDividerIdx) : tail;
          }
        }

        files.unshift({
          path: 'index.html',
          content: rawContent.trim(),
        });
      }
    }

    // Ensure index.html is prioritized first if it contains HTML
    const trueIndexIdx = files.findIndex(
      (f) =>
        f.content.includes('<!DOCTYPE') ||
        f.content.includes('<html') ||
        f.content.includes('<body') ||
        f.content.includes('<section') ||
        f.content.includes('<div')
    );

    if (trueIndexIdx > 0) {
      const [trueHtml] = files.splice(trueIndexIdx, 1);
      trueHtml.path = 'index.html';
      files.unshift(trueHtml);
    }

    return files;
  }

  /**
   * Generates a safe, isolated srcdoc HTML for iframe rendering
   */
  static generateSandboxHtml(files: ProjectFile[]): string {
    // Authoritative selection: find the file that ACTUALLY contains HTML markup
    let indexFile = files.find(
      (f) =>
        (f.path === 'index.html' || f.path.endsWith('.html')) &&
        (f.content.includes('<!DOCTYPE') ||
          f.content.includes('<html') ||
          f.content.includes('<body') ||
          f.content.includes('<div') ||
          f.content.includes('<section') ||
          f.content.includes('<header'))
    );

    // Fallback: any file with HTML tags
    if (!indexFile) {
      indexFile = files.find(
        (f) =>
          f.content.includes('<!DOCTYPE') ||
          f.content.includes('<html') ||
          f.content.includes('<body') ||
          f.content.includes('<div') ||
          f.content.includes('<section')
      );
    }

    if (!indexFile) indexFile = files[0];
    if (!indexFile || !indexFile.content.trim()) {
      return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;text-align:center;color:#6b7280;"><h3>Preview not ready yet</h3></body></html>`;
    }

    let html = indexFile.content;

    // Wrap section / fragment in full HTML5 harness if not already full document
    if (!html.includes('<html') && !html.includes('<!DOCTYPE')) {
      html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Website Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; margin: 0; padding: 0; min-height: 100vh; }
  </style>
</head>
<body class="bg-black text-white antialiased">
  ${html}
  <script>if (window.lucide) lucide.createIcons();</script>
</body>
</html>`;
    }

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
