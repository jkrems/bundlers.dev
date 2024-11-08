import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';

import { ExecTestCaseExecutor, type EnvInfo } from '../executor.ts';

const execFile = promisify(execFileCb);

export class NodejsTestCaseExecutor extends ExecTestCaseExecutor {
  protected getExecPath(): string {
    return 'node';
  }

  protected getExecFlags(): string[] {
    return [
      '--no-warnings',
      '--experimental-strip-types',
      `--import=${import.meta.resolve('./test-setup.ts')}`,
    ];
  }

  protected async getEnvInfo(): Promise<EnvInfo> {
    const { stdout } = await execFile('node', ['--version']);
    return {
      id: 'nodejs',
      version: stdout.trim().replace(/^v/, ''),
    };
  }
}
