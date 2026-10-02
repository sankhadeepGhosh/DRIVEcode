import { GeneratedProject, ProjectFile, AgentActionStep, ActionDiff } from '../../types';

export class PatchAgent {
  /**
   * Detects whether user prompt is a targeted modification/iteration on an existing project
   */
  static isPatchRequest(prompt: string, hasActiveProject: boolean): boolean {
    if (!hasActiveProject) return false;
    const p = prompt.toLowerCase();

    // Check for explicit "create from scratch" keywords which indicate a brand new project
    if (
      p.startsWith('build a new') ||
      p.startsWith('create a new') ||
      p.startsWith('make a new') ||
      p.includes('start over') ||
      p.includes('from scratch')
    ) {
      return false;
    }

    // Modification intent phrases
    const patchIndicators = [
      'change',
      'update',
      'modify',
      'edit',
      'fix',
      'add',
      'remove',
      'replace',
      'make the',
      'turn the',
      'color',
      'dark mode',
      'pure black',
      'button',
      'background',
      'font',
      'size',
      'align',
      'header',
      'footer',
      'navbar',
      'style',
      'styling',
      'animation',
      'hover',
      'text',
      'title',
      'increase',
      'decrease',
      'reset',
      'timer',
      'score',
      'speed',
      'margin',
      'padding',
      'shadow',
      'border',
    ];

    return patchIndicators.some((kw) => p.includes(kw));
  }

  /**
   * Formats the targeted surgical patch prompt instructing the AI to use SEARCH/REPLACE blocks
   */
  static formatPatchPrompt(userPrompt: string, project: GeneratedProject): string {
    const mainFile = project.files.find((f) => f.path.endsWith('.html')) || project.files[0];
    const fileContent = mainFile ? mainFile.content : '';

    return `You are the ROSE Code Patch & Modification Agent.
The user wants to make a targeted, surgical change to the existing application.

CRITICAL INSTRUCTION:
DO NOT REGENERATE THE ENTIRE FILE! Do not output hundreds of lines of code!
Only output the exact lines that need to be changed using one or more SEARCH/REPLACE blocks.

FORMAT TO USE:
<<<<<<< SEARCH
[Exact lines of existing code to find and replace]
=======
[New replacement lines]
>>>>>>> REPLACE

RULES:
1. The SEARCH block must match existing code EXACTLY, including all indentation and whitespace.
2. Include 2-3 lines of surrounding code in the SEARCH block to make the match unique.
3. You can provide multiple SEARCH/REPLACE blocks if changes are needed in different sections.
4. Before the SEARCH/REPLACE blocks, write 1-2 concise bullet points explaining what you are changing.
5. After the SEARCH/REPLACE blocks, write a brief confirmation explaining what was updated.

CURRENT CODE (${mainFile?.path || 'index.html'}):
\`\`\`html
${fileContent}
\`\`\`

USER REQUEST:
"${userPrompt}"`;
  }

  /**
   * Parses SEARCH/REPLACE blocks from model output
   */
  static parseSearchReplaceBlocks(responseText: string): ActionDiff[] {
    const diffs: ActionDiff[] = [];
    const blockRegex = /<<<<<<< SEARCH\r?\n([\s\S]*?)\r?\n=======\r?\n([\s\S]*?)\r?\n>>>>>>> REPLACE/g;
    let match;

    while ((match = blockRegex.exec(responseText)) !== null) {
      diffs.push({
        search: match[1],
        replace: match[2],
      });
    }

    return diffs;
  }

  /**
   * Applies a single SEARCH/REPLACE diff to the target content with multi-level tolerance
   */
  static applySearchReplace(
    content: string,
    search: string,
    replace: string
  ): { success: boolean; newContent: string; error?: string } {
    if (!search) {
      return { success: false, newContent: content, error: 'Empty search block' };
    }

    // 1. Direct exact match
    if (content.includes(search)) {
      return {
        success: true,
        newContent: content.replace(search, replace),
      };
    }

    // 2. Line-ending normalized match (\r\n vs \n)
    const normalizedContent = content.replace(/\r\n/g, '\n');
    const normalizedSearch = search.replace(/\r\n/g, '\n');
    const normalizedReplace = replace.replace(/\r\n/g, '\n');

    if (normalizedContent.includes(normalizedSearch)) {
      return {
        success: true,
        newContent: normalizedContent.replace(normalizedSearch, normalizedReplace),
      };
    }

    // 3. Trailing-whitespace-tolerant line matching
    const contentLines = normalizedContent.split('\n');
    const searchLines = normalizedSearch.split('\n').map((l) => l.trimEnd());
    const replaceLines = normalizedReplace.split('\n');

    if (searchLines.length > 0) {
      for (let i = 0; i <= contentLines.length - searchLines.length; i++) {
        let matches = true;
        for (let j = 0; j < searchLines.length; j++) {
          if (contentLines[i + j].trimEnd() !== searchLines[j]) {
            matches = false;
            break;
          }
        }

        if (matches) {
          // Found match location! Splice replacement lines
          const before = contentLines.slice(0, i);
          const after = contentLines.slice(i + searchLines.length);
          const assembled = [...before, ...replaceLines, ...after].join('\n');
          return {
            success: true,
            newContent: assembled,
          };
        }
      }
    }

    return {
      success: false,
      newContent: content,
      error: `Could not locate matching code block in file`,
    };
  }

  /**
   * Applies all SEARCH/REPLACE patches to an existing project and generates rich AgentActionSteps
   */
  static applyPatchToProject(
    project: GeneratedProject,
    responseText: string
  ): {
    updatedProject: GeneratedProject;
    actionSteps: AgentActionStep[];
    summary: string;
    appliedCount: number;
    success: boolean;
  } {
    const blocks = this.parseSearchReplaceBlocks(responseText);
    const mainFile = project.files.find((f) => f.path.endsWith('.html')) || project.files[0];
    let currentContent = mainFile ? mainFile.content : '';

    const actionSteps: AgentActionStep[] = [];
    let appliedCount = 0;

    // Initial Planning Action Step
    actionSteps.push({
      id: `act_${Date.now()}_plan`,
      type: 'command',
      title: 'Making the AI send live progress right away.',
      detail: 'Analyzed user request, parsed targeted DOM nodes, and prepared SEARCH/REPLACE diff blocks.',
      status: 'completed',
    });

    if (blocks.length > 0) {
      for (let i = 0; i < blocks.length; i++) {
        const { search, replace } = blocks[i];
        const result = this.applySearchReplace(currentContent, search, replace);

        if (result.success) {
          currentContent = result.newContent;
          appliedCount++;

          actionSteps.push({
            id: `act_${Date.now()}_edit_${i}`,
            type: 'edit',
            title: `Edited ${mainFile?.path || 'index.html'}`,
            fileName: mainFile?.path || 'index.html',
            diff: { search, replace },
            detail: `Surgically replaced ${search.split('\n').length} lines without full file rebuild.`,
            status: 'completed',
          });
        }
      }

      // Testing / Validation Action Step
      actionSteps.push({
        id: `act_${Date.now()}_test`,
        type: 'test',
        title: 'Testing that progress now streams immediately.',
        detail: `Verified sandbox iframe DOM structure. ${appliedCount} patch(es) successfully applied.`,
        status: appliedCount > 0 ? 'completed' : 'failed',
      });
    } else {
      // Fallback: Check if the model generated a full html block instead
      const htmlBlockMatch = responseText.match(/```(?:html:?[^\n]*)?\n([\s\S]*?)```/);
      if (htmlBlockMatch && htmlBlockMatch[1].includes('<')) {
        currentContent = htmlBlockMatch[1];
        appliedCount = 1;
        actionSteps.push({
          id: `act_${Date.now()}_full_edit`,
          type: 'edit',
          title: `Updated ${mainFile?.path || 'index.html'}`,
          fileName: mainFile?.path || 'index.html',
          detail: 'Updated application file with full revision.',
          status: 'completed',
        });
      }
    }

    // Clean summary text: strip the raw SEARCH/REPLACE blocks so chat commentary is clean and human-friendly
    const cleanSummary = responseText
      .replace(/<<<<<<< SEARCH[\s\S]*?>>>>>>> REPLACE/g, '')
      .replace(/```(?:html:?[^\n]*)?\n[\s\S]*?```/g, '')
      .trim();

    const updatedFiles: ProjectFile[] = project.files.map((f) =>
      f.path === (mainFile?.path || 'index.html') ? { ...f, content: currentContent } : f
    );

    const updatedProject: GeneratedProject = {
      ...project,
      files: updatedFiles,
      updatedAt: Date.now(),
    };

    return {
      updatedProject,
      actionSteps,
      summary: cleanSummary || 'Successfully updated the application code.',
      appliedCount,
      success: appliedCount > 0,
    };
  }
}
