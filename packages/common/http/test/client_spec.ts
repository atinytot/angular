/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/toPromise';

import {ddescribe, describe, iit, it} from '@angular/core/testing/src/testing_internal';

import {HttpClient} from '../src/client';
import {HttpEventType, HttpResponse} from '../src/response';
import {HttpClientTestingBackend} from '../testing/src/backend';

export function main() {
  describe('HttpClient', () => {
    let client: HttpClient = null !;
    let backend: HttpClientTestingBackend = null !;
    beforeEach(() => {
      backend = new HttpClientTestingBackend();
      client = new HttpClient(backend);
    });
    afterEach(() => { backend.verify(); });
    describe('makes a basic request', () => {
      it('for JSON data', (done: DoneFn) => {
        client.get('/test').subscribe(res => {
          expect((res as any)['data']).toEqual('hello world');
          done();
        });
        backend.expectOne('/test').flush({'data': 'hello world'});
      });
      it('for text data', (done: DoneFn) => {
        client.get('/test', {responseType: 'text'}).subscribe(res => {
          expect(res).toEqual('hello world');
          done();
        });
        backend.expectOne('/test').flush('hello world');
      });
      it('for an arraybuffer', (done: DoneFn) => {
        const body = new ArrayBuffer(4);
        client.get('/test', {responseType: 'arraybuffer'}).subscribe(res => {
          expect(res).toBe(body);
          done();
        });
        backend.expectOne('/test').flush(body);
      });
      if (typeof Blob !== 'undefined') {
        it('for a blob', (done: DoneFn) => {
          const body = new Blob([new ArrayBuffer(4)]);
          client.get('/test', {responseType: 'blob'}).subscribe(res => {
            expect(res).toBe(body);
            done();
          });
          backend.expectOne('/test').flush(body);
        });
      }
      it('that returns a response', (done: DoneFn) => {
        const body = {'data': 'hello world'};
        client.get('/test', {observe: 'response'}).subscribe(res => {
          expect(res instanceof HttpResponse).toBe(true);
          expect(res.body).toBe(body);
          done();
        });
        backend.expectOne('/test').flush(body);
      });
      it('that returns a stream of events', (done: DoneFn) => {
        client.get('/test', {observe: 'events'}).toArray().toPromise().then(events => {
          expect(events.length).toBe(2);
          expect(events[0].type).toBe(HttpEventType.Sent);
          expect(events[1].type).toBe(HttpEventType.Response);
          expect(events[1] instanceof HttpResponse).toBeTruthy();
          done();
        });
        backend.expectOne('/test').flush({'data': 'hello world'});
      });
    });
    describe('makes a POST request', () => {
      it('with text data', (done: DoneFn) => {
        client.post('/test', 'text body', {observe: 'response', responseType: 'text'})
            .subscribe(res => {
              expect(res.ok).toBeTruthy();
              expect(res.status).toBe(200);
              done();
            });
        backend.expectOne('/test').flush('hello world');
      });
      it('with json data', (done: DoneFn) => {
        const body = {data: 'json body'};
        client.post('/test', body, {observe: 'response', responseType: 'text'}).subscribe(res => {
          expect(res.ok).toBeTruthy();
          expect(res.status).toBe(200);
          done();
        });
        const testReq = backend.expectOne('/test');
        expect(testReq.request.body).toBe(body);
        testReq.flush('hello world');
      });
      it('with an arraybuffer', (done: DoneFn) => {
        const body = new ArrayBuffer(4);
        client.post('/test', body, {observe: 'response', responseType: 'text'}).subscribe(res => {
          expect(res.ok).toBeTruthy();
          expect(res.status).toBe(200);
          done();
        });
        const testReq = backend.expectOne('/test');
        expect(testReq.request.body).toBe(body);
        testReq.flush('hello world');
      });
    });
    describe('makes a JSONP request', () => {
      it('with properly set method and callback', (done: DoneFn) => {
        client.jsonp('/test', 'myCallback').subscribe(() => done());
        backend.expectOne({method: 'JSONP', url: '/test?myCallback=JSONP_CALLBACK'})
            .flush('hello world');
      });
    });
  });
}