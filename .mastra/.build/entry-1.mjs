import { createTool } from '@mastra/core';
import { z } from 'zod';

const codeTool = createTool({
  id: "code-tool",
  description: "A tool for working with code",
  inputSchema: z.object({
    code: z.string().min(1, "Cannot be Empty"),
    language: z.string().optional(),
    context: z.string().optional()
  }),
  outputSchema: z.object({
    result: z.string()
  }),
  // A simple code execution tool that evaluates JavaScript code snippets.
  execute: async ({ context }) => {
    const code = context.code;
    let result;
    console.log("Executing code:", code);
    if (!code) {
      throw new Error("No code provided");
    }
    if (typeof code !== "string") {
      throw new Error("Code must be a string");
    }
    try {
      result = await someCodeExecutionFunction();
    } catch (error) {
      console.error("Error executing code:", error);
      throw new Error("Code execution failed");
    }
    return { result };
  }
});
function someCodeExecutionFunction(code) {
  throw new Error("Function not implemented.");
}

export { codeTool, codeTool as default };
