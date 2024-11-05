import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';

import { ExecTestCaseExecutor, type EnvInfo } from '../executor.ts';

const execFile = promisify(execFileCb);

export class DenoTestCaseExecutor extends ExecTestCaseExecutor {
  protected getExecPath(): string {
    return 'deno';
  }

  protected getExecFlags(): string[] {
    // Deno has no preload scripts so we need to roll our own.
    // If we want data on import.meta.main, that'll be annoying.
    return [
      '--allow-env',
      '--allow-read',
      '--cached-only',
      '--no-lock',
      import.meta.resolve('./entry-wrap.ts'),
    ];
  }

  protected async getEnvInfo(): Promise<EnvInfo> {
    // Example output:
    // $ deno --version
    // deno 1.46.3 (stable, release, aarch64-apple-darwin)
    // v8 12.9.202.5-rusty
    // typescript 5.5.2
    const { stdout } = await execFile('deno', ['--version']);
    const denoMatch = stdout.match(/^deno v?([\d.]+)/m);
    if (!denoMatch) {
      throw new Error(`Could not find deno version in ${stdout}`);
    }
    return {
      id: 'deno',
      version: denoMatch[1],
    };
  }
}
