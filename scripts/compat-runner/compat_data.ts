import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  assertCompatNode,
  type Compat,
  type CompatJson,
  type PlatformId,
} from './compat_data_schema.ts';
import type { TestSuiteResult } from './executor.ts';

export class CompatDataFile {}

export class CompatGroup {
  private readonly name: string;
  private readonly rootNode: CompatJson;

  constructor(name: string, rootNode: CompatJson) {
    this.name = name;
    this.rootNode = rootNode;
  }

  getCompat(subpath: string[]): Compat {
    let compatData = this.rootNode;

    while (!('__compat' in compatData)) {
      const keys = Object.keys(compatData);
      if (keys.length !== 1) {
        throw new Error(
          `Expected unambiguous root in compat data for '${this.name}'`,
        );
      }
      compatData = compatData[keys[0]]!;
    }
    const node = subpath.reduce<CompatJson>((obj: CompatJson, key: string) => {
      if (!obj[key]) {
        throw new Error(`Could not find ${key}`);
      }
      return obj[key];
    }, compatData);

    assertCompatNode(node, this.name);

    return node.__compat;
  }
}

export interface CompatDataSource {
  getGroup(groupName: string): CompatGroup;
}

export class CompatDataDiskSource implements CompatDataSource {
  private readonly rootDir;
  private readonly cache = new Map<string, CompatGroup>();

  constructor({ rootDir }: { rootDir: string }) {
    this.rootDir = rootDir;
  }

  getGroup(groupName: string): CompatGroup {
    let group: CompatGroup | undefined = this.cache.get(groupName);
    if (group) {
      return group;
    }
    const json = JSON.parse(
      readFileSync(join(this.rootDir, `${groupName}.json`), 'utf8'),
    ) as CompatJson;
    group = new CompatGroup(groupName, json);
    this.cache.set(groupName, group);
    return group;
  }
}

function getCompat(
  compatData: CompatJson,
  groupName: string,
  compatSubpath: string[],
): Compat {
  while (!('__compat' in compatData)) {
    const keys = Object.keys(compatData);
    if (keys.length !== 1) {
      throw new Error(
        `Expected unambiguous root in compat data for '${groupName}'`,
      );
    }
    compatData = compatData[keys[0]]!;
  }
  const node = compatSubpath.reduce<CompatJson>(
    (obj: CompatJson, key: string) => {
      if (!obj[key]) {
        throw new Error(`Could not find ${key}`);
      }
      return obj[key];
    },
    compatData,
  );

  assertCompatNode(node, groupName);

  return node.__compat;
}

export class CompatData {
  private readonly source;

  constructor(source: CompatDataSource) {
    this.source = source;
  }

  applyTestResult(result: TestSuiteResult<PlatformId>) {
    const group = this.source.getGroup(result.compatGroup);
    const compat = group.getCompat(result.compatSubpath);

    console.log('applyTestResult', result, compat.support[result.platform.id]);

    // TODO:
    // 1. Expand current support into [{version: 0.0.0, support: none}, ...].
    // 2. Merge in new support value.
    // 3. Create simplification to normal support values.
  }
}
