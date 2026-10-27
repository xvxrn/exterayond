/**
 * Import the production IM graph in a fresh browser, without signing in or
 * starting dialogs. Dev and the popup bundle have different chunk layouts,
 * so they cannot catch a production chunk evaluating a subclass before its base.
 *
 * Usage: pnpm test:startup [dist]
 * Requires a built bundle and Playwright's Chromium. An existing Chromium can
 * be selected with PLAYWRIGHT_CHROMIUM_EXECUTABLE.
 */
import assert from 'node:assert/strict';
import {once} from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import express from 'express';
import {parseAst} from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.resolve(root, process.argv[2] || 'dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const entry = html.match(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/)?.[1];
assert(entry, 'The bundle has no module entry');

// Use the bundle's own dynamic-import adapter. strictExecutionOrder emits an
// explicit initializer before returning a module's namespace; importing the
// shared chunk directly would skip it and test a path the app never takes.
let bootstrap;
let adapter;
for(const file of fs.readdirSync(dist).filter((file) => file.endsWith('.js'))) {
  const source = fs.readFileSync(path.join(dist, file), 'utf8');
  if(!source.includes('./bootstrapIm-')) continue;

  const visit = (node) => {
    if(!node || typeof(node) !== 'object' || bootstrap) return;
    const call = node.type === 'CallExpression' && node.callee;
    const imported = call?.type === 'MemberExpression' && call.object;
    if(call?.property?.name === 'then' && imported?.type === 'ImportExpression') {
      const specifier = imported.source.value ?? imported.source.quasis?.[0]?.value.cooked;
      if(specifier?.startsWith('./bootstrapIm-')) {
        bootstrap = specifier;
        adapter = source.slice(node.arguments[0].start, node.arguments[0].end);
        return;
      }
    }

    for(const value of Object.values(node)) {
      if(Array.isArray(value)) value.forEach(visit);
      else if(value && typeof(value) === 'object') visit(value);
    }
  };
  visit(parseAst(source));

  // Without strict execution order the namespace is exported directly.
  bootstrap ??= source.match(/import\([`'"](\.\/bootstrapIm-[^`'"]+)[`'"]\)/)?.[1];
  if(bootstrap) break;
}
assert(bootstrap, 'The bundle has no IM bootstrap import');

const app = express();
// The real entry is imported after DOMContentLoaded: its normal account/auth
// bootstrap never runs. Only the explicitly invoked, idle IM graph is tested.
app.get('/__startup_test__', (_request, response) => response.type('html').send(
  html.replace(/<script\b[^>]*src="[^"]+"[^>]*><\/script>/g, '')
));
app.use(express.static(dist));
app.use(express.static(path.join(root, 'public')));
const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
  const context = await browser.newContext();
  // This check has no Telegram traffic, authorization seed or persisted browser.
  await context.route('**/*', (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.routeWebSocket(/.*/, (route) => route.close());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error));
  await page.goto(`${origin}/__startup_test__`);
  await page.evaluate(async({entry, bootstrap, adapter}) => {
    await import(new URL(entry, location.href).href);
    const imported = await import(new URL(bootstrap, location.href).href);
    const boot = adapter ? new Function('module', `return (${adapter})(module)`)(imported) :
      Object.values(imported).find((value) => value && typeof(value.importAppTopLevel) === 'function');

    // Module-level subscriptions can read these while the idle graph evaluates.
    // All manager requests terminate here, in this disposable fixture.
    const managers = new Proxy({}, {
      get: (_target, name) => name === 'then' ? undefined : new Proxy({}, {
        get: (_manager, method) => (..._args) => Promise.resolve(
          name === 'appPaymentsManager' && method === 'getStarsStatus' ? {balance: {_: 'starsAmount', amount: 0, nanos: 0}} :
          name === 'apiManager' && method === 'getAccountNumber' ? 1 :
          name === 'rootScope' && method === 'getPremium' ? false : undefined
        )
      })
    });
    window.rootScope.managers = managers;
    const invoke = window.apiManagerProxy.invoke.bind(window.apiManagerProxy);
    window.apiManagerProxy.invoke = (task, data, ...rest) => task === 'manager' ?
      managers[data.name][data.method](...data.args) : invoke(task, data, ...rest);

    const dialogs = await boot.importAppTopLevel();
    if(typeof(dialogs.start) !== 'function') throw new Error('IM graph did not initialize');
  }, {entry, bootstrap, adapter});
  assert.equal(errors.length, 0, errors.map((error) => error.stack).join('\n'));
  console.log('Production IM modules initialized without an account or Telegram traffic');
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
