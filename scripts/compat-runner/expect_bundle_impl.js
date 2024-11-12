import * as chai from 'chai';
import {
  JestAsymmetricMatchers,
  JestChaiExpect,
  JestExtend,
} from '@vitest/expect';

chai.use(JestExtend);
chai.use(JestChaiExpect);
chai.use(JestAsymmetricMatchers);

export { expect } from 'chai';
