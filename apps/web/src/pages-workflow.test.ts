// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

interface Step {
  id?: string;
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
}
interface Job {
  needs?: string;
  environment?: { name?: string };
  steps: Step[];
}
interface Workflow {
  on: unknown;
  permissions: unknown;
  concurrency: { group: string };
  jobs: { build: Job; deploy: Job };
}

const dir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../.github/workflows",
);
const text = readFileSync(resolve(dir, "pages.yml"), "utf8");
const workflow = parse(text) as Workflow;
const { build, deploy } = workflow.jobs;
const uses = (job: Job): string[] =>
  job.steps.flatMap((s) => (s.uses ? [s.uses] : []));
const runs = (job: Job): string[] =>
  job.steps.flatMap((s) => (s.run ? [s.run] : []));

describe("pages workflow", () => {
  it("is the only workflow and runs on push to main only", () => {
    expect(readdirSync(dir)).toEqual(["pages.yml"]);
    expect(workflow.on).toEqual({ push: { branches: ["main"] } });
  });

  it("has the Pages permissions and a non-cancelling pages concurrency group", () => {
    expect(workflow.permissions).toEqual({
      contents: "read",
      pages: "write",
      "id-token": "write",
    });
    expect(workflow.concurrency.group).toBe("pages");
  });

  it("builds @orbit/web and uploads its dist", () => {
    expect(runs(build)).toEqual(
      expect.arrayContaining([
        "pnpm install --frozen-lockfile",
        "pnpm --filter @orbit/web build",
      ]),
    );
    expect(uses(build).some((u) => u.startsWith("actions/checkout"))).toBe(
      true,
    );
    expect(
      uses(build).some((u) => u.startsWith("actions/configure-pages")),
    ).toBe(true);
    const upload = build.steps.find((s) =>
      s.uses?.startsWith("actions/upload-pages-artifact"),
    );
    expect(upload?.with?.path).toBe("apps/web/dist");
    const node = build.steps.find((s) =>
      s.uses?.startsWith("actions/setup-node"),
    );
    expect(node?.with?.["node-version"]).toBe(22);
  });

  it("deploys to the github-pages environment after the build", () => {
    expect(deploy.needs).toBe("build");
    expect(deploy.environment?.name).toBe("github-pages");
    const step = deploy.steps.find((s) =>
      s.uses?.startsWith("actions/deploy-pages"),
    );
    expect(step?.id).toBe("deployment");
  });

  it("adds no test, lint, publish, version, release or changelog steps", () => {
    const names = [
      ...runs(build),
      ...uses(build),
      ...runs(deploy),
      ...uses(deploy),
    ];
    expect(
      names.filter((n) =>
        /test|lint|publish|version|release|changelog/i.test(n),
      ),
    ).toEqual([]);
  });

  it("records the cost estimate", () => {
    expect(text).toContain("$0.096");
  });
});
