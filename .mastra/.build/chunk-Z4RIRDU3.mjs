import { a as createStep, c as createWorkflow, A as Agent, t as tryGenerateWithJsonFallback } from './chunk-LG5B3KIW.mjs';
import { r as resolveModelConfig } from './chunk-FHVFGVIO.mjs';
import { M as MastraError } from './error.mjs';
import { randomUUID } from 'crypto';
import { a as any, o as object, s as string, n as number } from './coerce.mjs';

var MastraScorer = class _MastraScorer {
  constructor(config, steps = [], originalPromptObjects = /* @__PURE__ */ new Map()) {
    this.config = config;
    this.steps = steps;
    this.originalPromptObjects = originalPromptObjects;
  }
  get type() {
    return this.config.type;
  }
  get name() {
    return this.config.name;
  }
  get description() {
    return this.config.description;
  }
  get judge() {
    return this.config.judge;
  }
  preprocess(stepDef) {
    const isPromptObj = this.isPromptObject(stepDef);
    if (isPromptObj) {
      const promptObj = stepDef;
      this.originalPromptObjects.set("preprocess", promptObj);
    }
    return new _MastraScorer(
      this.config,
      [
        ...this.steps,
        {
          name: "preprocess",
          definition: stepDef,
          isPromptObject: isPromptObj
        }
      ],
      new Map(this.originalPromptObjects)
    );
  }
  analyze(stepDef) {
    const isPromptObj = this.isPromptObject(stepDef);
    if (isPromptObj) {
      const promptObj = stepDef;
      this.originalPromptObjects.set("analyze", promptObj);
    }
    return new _MastraScorer(
      this.config,
      [
        ...this.steps,
        {
          name: "analyze",
          definition: isPromptObj ? void 0 : stepDef,
          isPromptObject: isPromptObj
        }
      ],
      new Map(this.originalPromptObjects)
    );
  }
  generateScore(stepDef) {
    const isPromptObj = this.isPromptObject(stepDef);
    if (isPromptObj) {
      const promptObj = stepDef;
      this.originalPromptObjects.set("generateScore", promptObj);
    }
    return new _MastraScorer(
      this.config,
      [
        ...this.steps,
        {
          name: "generateScore",
          definition: isPromptObj ? void 0 : stepDef,
          isPromptObject: isPromptObj
        }
      ],
      new Map(this.originalPromptObjects)
    );
  }
  generateReason(stepDef) {
    const isPromptObj = this.isPromptObject(stepDef);
    if (isPromptObj) {
      const promptObj = stepDef;
      this.originalPromptObjects.set("generateReason", promptObj);
    }
    return new _MastraScorer(
      this.config,
      [
        ...this.steps,
        {
          name: "generateReason",
          definition: isPromptObj ? void 0 : stepDef,
          isPromptObject: isPromptObj
        }
      ],
      new Map(this.originalPromptObjects)
    );
  }
  get hasGenerateScore() {
    return this.steps.some((step) => step.name === "generateScore");
  }
  async run(input) {
    if (!this.hasGenerateScore) {
      throw new MastraError({
        id: "MASTR_SCORER_FAILED_TO_RUN_MISSING_GENERATE_SCORE",
        domain: "SCORER" /* SCORER */,
        category: "USER" /* USER */,
        text: `Cannot execute pipeline without generateScore() step`,
        details: {
          scorerId: this.config.name,
          steps: this.steps.map((s) => s.name).join(", ")
        }
      });
    }
    const { tracingContext } = input;
    let runId = input.runId;
    if (!runId) {
      runId = randomUUID();
    }
    const run = { ...input, runId };
    const workflow = this.toMastraWorkflow();
    const workflowRun = await workflow.createRunAsync();
    const workflowResult = await workflowRun.start({
      inputData: {
        run
      },
      tracingContext
    });
    if (workflowResult.status === "failed") {
      throw new MastraError({
        id: "MASTR_SCORER_FAILED_TO_RUN_WORKFLOW_FAILED",
        domain: "SCORER" /* SCORER */,
        category: "USER" /* USER */,
        text: `Scorer Run Failed: ${workflowResult.error}`,
        details: {
          scorerId: this.config.name,
          steps: this.steps.map((s) => s.name).join(", ")
        }
      });
    }
    return this.transformToScorerResult({ workflowResult, originalInput: run });
  }
  isPromptObject(stepDef) {
    if (typeof stepDef === "object" && "description" in stepDef && "createPrompt" in stepDef && !("outputSchema" in stepDef)) {
      return true;
    }
    const isOtherPromptObject = typeof stepDef === "object" && "description" in stepDef && "outputSchema" in stepDef && "createPrompt" in stepDef;
    return isOtherPromptObject;
  }
  getSteps() {
    return this.steps.map((step) => ({
      name: step.name,
      type: step.isPromptObject ? "prompt" : "function",
      description: step.definition.description
    }));
  }
  toMastraWorkflow() {
    const workflowSteps = this.steps.map((scorerStep) => {
      return createStep({
        id: scorerStep.name,
        description: `Scorer step: ${scorerStep.name}`,
        inputSchema: any(),
        outputSchema: any(),
        execute: async ({ inputData, getInitData, tracingContext }) => {
          const { accumulatedResults = {}, generatedPrompts = {} } = inputData;
          const { run } = getInitData();
          const context = this.createScorerContext(scorerStep.name, run, accumulatedResults);
          let stepResult;
          let newGeneratedPrompts = generatedPrompts;
          if (scorerStep.isPromptObject) {
            const { result, prompt } = await this.executePromptStep(scorerStep, tracingContext, context);
            stepResult = result;
            newGeneratedPrompts = {
              ...generatedPrompts,
              [`${scorerStep.name}Prompt`]: prompt
            };
          } else {
            stepResult = await this.executeFunctionStep(scorerStep, context);
          }
          const newAccumulatedResults = {
            ...accumulatedResults,
            [`${scorerStep.name}StepResult`]: stepResult
          };
          return {
            stepResult,
            accumulatedResults: newAccumulatedResults,
            generatedPrompts: newGeneratedPrompts
          };
        }
      });
    });
    const workflow = createWorkflow({
      id: `scorer-${this.config.name}`,
      description: this.config.description,
      inputSchema: object({
        run: any()
        // ScorerRun
      }),
      outputSchema: object({
        run: any(),
        score: number(),
        reason: string().optional(),
        preprocessResult: any().optional(),
        analyzeResult: any().optional(),
        preprocessPrompt: string().optional(),
        analyzePrompt: string().optional(),
        generateScorePrompt: string().optional(),
        generateReasonPrompt: string().optional()
      }),
      options: {
        // mark all spans generated as part of the scorer workflow internal
        tracingPolicy: {
          internal: 15 /* ALL */
        }
      }
    });
    let chainedWorkflow = workflow;
    for (const step of workflowSteps) {
      chainedWorkflow = chainedWorkflow.then(step);
    }
    return chainedWorkflow.commit();
  }
  createScorerContext(stepName, run, accumulatedResults) {
    if (stepName === "generateReason") {
      const score = accumulatedResults.generateScoreStepResult;
      return { run, results: accumulatedResults, score };
    }
    return { run, results: accumulatedResults };
  }
  async executeFunctionStep(scorerStep, context) {
    return await scorerStep.definition(context);
  }
  async executePromptStep(scorerStep, tracingContext, context) {
    const originalStep = this.originalPromptObjects.get(scorerStep.name);
    if (!originalStep) {
      throw new Error(`Step "${scorerStep.name}" is not a prompt object`);
    }
    const prompt = await originalStep.createPrompt(context);
    const modelConfig = originalStep.judge?.model ?? this.config.judge?.model;
    const instructions = originalStep.judge?.instructions ?? this.config.judge?.instructions;
    if (!modelConfig || !instructions) {
      throw new MastraError({
        id: "MASTR_SCORER_FAILED_TO_RUN_MISSING_MODEL_OR_INSTRUCTIONS",
        domain: "SCORER" /* SCORER */,
        category: "USER" /* USER */,
        text: `Step "${scorerStep.name}" requires a model and instructions`,
        details: {
          scorerId: this.config.name,
          step: scorerStep.name
        }
      });
    }
    const resolvedModel = await resolveModelConfig(modelConfig);
    const judge = new Agent({
      name: "judge",
      model: resolvedModel,
      instructions,
      options: { tracingPolicy: { internal: 15 /* ALL */ } }
    });
    if (scorerStep.name === "generateScore") {
      const schema = object({ score: number() });
      let result;
      if (resolvedModel.specificationVersion === "v2") {
        result = await tryGenerateWithJsonFallback(judge, prompt, {
          structuredOutput: {
            schema
          },
          tracingContext
        });
      } else {
        result = await judge.generateLegacy(prompt, {
          output: schema,
          tracingContext
        });
      }
      return { result: result.object.score, prompt };
    } else if (scorerStep.name === "generateReason") {
      let result;
      if (resolvedModel.specificationVersion === "v2") {
        result = await judge.generate(prompt, { tracingContext });
      } else {
        result = await judge.generateLegacy(prompt, { tracingContext });
      }
      return { result: result.text, prompt };
    } else {
      const promptStep = originalStep;
      let result;
      if (resolvedModel.specificationVersion === "v2") {
        result = await tryGenerateWithJsonFallback(judge, prompt, {
          structuredOutput: {
            schema: promptStep.outputSchema
          },
          tracingContext
        });
      } else {
        result = await judge.generateLegacy(prompt, {
          output: promptStep.outputSchema,
          tracingContext
        });
      }
      return { result: result.object, prompt };
    }
  }
  transformToScorerResult({
    workflowResult,
    originalInput
  }) {
    const finalStepResult = workflowResult.result;
    const accumulatedResults = finalStepResult?.accumulatedResults || {};
    const generatedPrompts = finalStepResult?.generatedPrompts || {};
    return {
      ...originalInput,
      score: accumulatedResults.generateScoreStepResult,
      generateScorePrompt: generatedPrompts.generateScorePrompt,
      reason: accumulatedResults.generateReasonStepResult,
      generateReasonPrompt: generatedPrompts.generateReasonPrompt,
      preprocessStepResult: accumulatedResults.preprocessStepResult,
      preprocessPrompt: generatedPrompts.preprocessPrompt,
      analyzeStepResult: accumulatedResults.analyzeStepResult,
      analyzePrompt: generatedPrompts.analyzePrompt
    };
  }
};
function createScorer(config) {
  return new MastraScorer({
    name: config.name,
    description: config.description,
    judge: config.judge,
    type: config.type
  });
}

export { createScorer as c };
