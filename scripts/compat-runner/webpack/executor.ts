import { type Configuration, type OutputFileSystem, type Stats } from 'webpack';
import { createFsFromVolume, Volume } from 'memfs';
import { join } from 'node:path';

import { type TestResult, type PlatformInfo } from '../executor.ts';
import {
  BundlingTestCaseExecutor,
  type PageContext,
} from '../bundling_executor.ts';
import { PLATFORMS } from '../compat_data_schema.ts';

type PackageType = Pick<typeof import('webpack'), 'webpack' | 'version'>;

function findWebpackFunction(
  pkg: PackageType,
): typeof import('webpack').webpack {
  if (typeof pkg.webpack === 'function') {
    return pkg.webpack;
  }
  if ('default' in pkg && typeof pkg.default === 'function') {
    return pkg.default as typeof import('webpack').webpack;
  }
  throw new Error('Could not find "webpack" export');
}

function findWebpackVersion(
  pkg: PackageType,
): typeof import('webpack').version {
  if (typeof pkg.version === 'string') {
    return pkg.version;
  }
  if (
    'default' in pkg &&
    typeof pkg.default === 'function' &&
    'version' in pkg.default &&
    typeof pkg.default.version === 'string'
  ) {
    return pkg.default.version;
  }
  throw new Error('Could not find "webpack.version" export');
}

export class WebpackTestCaseExecutor extends BundlingTestCaseExecutor<
  'webpack',
  PackageType
> {
  protected override async getPlatformInfo(
    pkg: PackageType,
  ): Promise<PlatformInfo<'webpack'>> {
    return {
      ...PLATFORMS.webpack,
      version: findWebpackVersion(pkg),
    };
  }

  protected override getPackageName(): string {
    return 'webpack';
  }

  protected override loadDefaultPackage(): Promise<PackageType> {
    return import('webpack');
  }

  protected override async setupPageContext(
    filename: string,
    cwd: string,
    pkg: PackageType,
    pageContext: PageContext,
  ): Promise<TestResult[] | null> {
    let stats: Stats;
    const outdir = join(cwd, '.tmp', pageContext.id);
    const volume = new Volume();
    const fs = createFsFromVolume(volume);
    try {
      const options: Configuration = {
        target: 'web',
        mode: 'development',
        context: cwd,
        entry: { main: `./${filename}` },
        output: {
          path: outdir,
          publicPath: `/${pageContext.id}/`,
        },
      };
      const compiler = findWebpackFunction(pkg)(options);
      compiler.outputFileSystem = fs as OutputFileSystem;

      stats = await new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
          err ? reject(err) : resolve(stats!);
        });
      });
    } catch (e) {
      console.error('???', e);
      return [
        {
          description: 'Build test suite',
          error: {
            message: `Test suite failed to build: ${e instanceof Error ? e.message : e}`,
          },
        },
      ];
    }

    if (stats.hasErrors()) {
      return stats.toJson().errors!.map((err) => ({
        description: err.message,
        error: {
          message: err.message,
        },
      }));
    }

    function forwardFiles(subPath: string = '') {
      const fsPath = `${outdir}${subPath}`;
      for (const outFile of fs.readdirSync(fsPath)) {
        const newSubPath = `${subPath}/${outFile}`;
        const newFsPath = `${outdir}${newSubPath}`;
        try {
          const contents = fs.readFileSync(newFsPath);
          pageContext.files.set(newSubPath, contents);
          continue;
        } catch (e) {
          if ((e as any)?.code !== 'EISDIR') {
            throw e;
          }
        }
        forwardFiles(newSubPath);
      }
    }

    forwardFiles();

    return null;
  }
}
