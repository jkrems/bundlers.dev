export abstract class TestCaseExecutor {
  abstract run(filenames: string[], cwd: string): Promise<unknown>;
}
