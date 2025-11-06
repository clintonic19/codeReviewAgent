


/**
 * Example: Replace this with your actual linters, static analyzers, or LLM prompts.
 * This mock function demonstrates expected behavior and returns a ReviewResult-shaped object.
 */ 


interface ReviewFile {
  path: string;
  content: string;
}

interface ReviewOptions {
  complexityThreshold?: number;
}

interface ReviewRequest {
  files: ReviewFile[];
  options?: ReviewOptions;
}

type Severity = "info" | "warning" | "critical";

interface ReviewComment {
  filePath: string;
  startLine: number;
  endLine: number;
  severity: Severity;
  message: string;
  suggestion?: string;
  automatedFixAvailable?: boolean;
  ruleId?: string;
}

const codeReview = (request: ReviewRequest) => {
  const comments: ReviewComment[] = [];

  for (const file of request.files) {
    // Very small mock rules:
    // - if file larger than 1000 chars -> comment about "large file"
    if (file.content.length > 1000) {
      comments.push({
        filePath: file.path,
        startLine: 1,
        endLine: 1,
        severity: "info",
        message: "File is large — consider splitting into smaller modules.",
        suggestion: "Split large file by feature boundaries.",
        automatedFixAvailable: false,
      });
    }

    // - mock: look for 'eval(' usage -> security error
    const evalIndex = file.content.indexOf("eval(");
    if (evalIndex !== -1) {
      // approximate line detection:
      const before = file.content.slice(0, evalIndex);
      const startLine = before.split("\n").length;
      comments.push({
        filePath: file.path,
        startLine,
        endLine: startLine,
        severity: "critical",
        ruleId: "no-eval",
        message: "Use of `eval()` detected — this is a security risk.",
        suggestion: "Avoid eval; use safer parsing and functions.",
        automatedFixAvailable: false,
      });
    }

    // - mock: trailing whitespace lines -> warning
    const lines = file.content.split("\n");
    lines.forEach((line: string, idx: number) => {
      if (/\s+$/.test(line)) {
        comments.push({
          filePath: file.path,
          startLine: idx + 1,
          endLine: idx + 1,
          severity: "warning",
          message: "Trailing whitespace.",
          suggestion: "Remove trailing spaces or configure an editor to trim on save.",
          automatedFixAvailable: true,
        });
      }
    });

    // - mock complexity check: count `if` occurrences
    const ifCount = (file.content.match(/\bif\b/g) || []).length;
    if (ifCount > (request.options?.complexityThreshold ?? 15)) {
      comments.push({
        filePath: file.path,
        startLine: 1,
        endLine: 1,
        severity: "warning",
        ruleId: "high-complexity",
        message: `File contains ${ifCount} if-statements — consider simplifying or extracting functions.`,
        suggestion: "Refactor into smaller functions, use strategy or state patterns.",
        automatedFixAvailable: false,
      });
    }
  }

  return { comments };
}

export default codeReview;
