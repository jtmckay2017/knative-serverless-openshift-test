'use strict';
import { start, InvokerOptions } from 'faas-js-runtime';
import request from 'supertest';

import * as func from '../build';
import test, { Test } from 'tape';

const data = {
  "company_name": "Joel Test Company",
  "company_subdomain": "joeltestcomp",
  "company_slug": "jtc",
  "identity_name_first": "Jol",
  "identity_name_last": "MKay",
  "identity_personal_email": "joel.mckay+jtc@agileonboarding.com",
  "identity_work_email": "joel.mckay+jtc@agileonboarding.com",
  "identity_mobile_phone": "5401123654",
}

const errHandler = (t: Test) => (err: Error) => {
  t.error(err);
  t.end();
};

test('Integration: handles a valid request', (t) => {
  start(func.handle, {} as InvokerOptions).then((server) => {
    t.plan(3);
    request(server)
      .post('/')
      .send(data)
      .expect(200)
      .expect('Content-Type', /json/)
      .end((err, result) => {
        t.error(err, 'No error');
        t.ok(result);
        t.equal(JSON.stringify(result.body), JSON.stringify(data));
        t.end();
        server.close();
      });
  }, errHandler(t));
});
