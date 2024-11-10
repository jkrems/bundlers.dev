export class CompatDataFile {}

export interface CompatDataSource {}

export class CompatDataDiskSource {}

export class CompatData {
  constructor(
    private readonly source: CompatDataSource = new CompatDataDiskSource(),
  ) {}
}
