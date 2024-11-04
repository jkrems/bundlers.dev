import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';

import { ExecTestCaseExecutor, type EnvInfo } from '../executor.ts';

const execFile = promisify(execFileCb);

export class BunTestCaseExecutor extends ExecTestCaseExecutor {
  protected getExecPath(): string {
    return 'bun';
  }

  protected getExecFlags(): string[] {
    return [`--preload=${import.meta.resolve('./test-setup.ts')}`];
  }

  protected async getEnvInfo(): Promise<EnvInfo> {
    const { stdout } = await execFile('bun', ['--version']);
    return {
      id: 'bun',
      version: stdout.trim().replace(/^v/, ''),
    };
  }
}
