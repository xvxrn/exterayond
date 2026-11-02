import {describe, expect, it} from 'vitest';
import {extractConstants, readPluginMetadata} from '@plugins/metadata';

describe('plugin metadata reader (port of metadata_parser.py)', () => {
  it('reads the dunder block of a real-shaped plugin', () => {
    const source = `
"""Botile-like plugin file."""
import json
from elyx_runtime import base_plugin

__id__ = 'example_plugin'
__name__ = "Example Plugin"
__description__ = 'Does things, "quoted", carefully'
__author__ = 'someone'
__version__ = '1.2.3'
__min_version__ = '12.5.1'
__beta__ = False
__requirements__ = 'cachetools>=5.3, requests'
__permissions__ = ['ui', 'messages.read', 'network']

class ExamplePlugin(base_plugin.BasePlugin):
    def on_plugin_load(self):
        pass
`;
    const result = readPluginMetadata(source);
    expect(result.ok).toBe(true);
    if(!result.ok) return;
    expect(result.meta).toMatchObject({
      id: 'example_plugin',
      name: 'Example Plugin',
      description: 'Does things, "quoted", carefully',
      version: '1.2.3',
      app_version: '>=12.5.1',
      requirements: ['cachetools>=5.3', 'requests'],
      permissions: ['ui', 'messages.read', 'network'],
      permissions_declared: true
    });
  });

  it('ignores dynamic metadata by design, first assignment wins', () => {
    const source = `
__id__ = 'first_id'
__id__ = compute_id()
__name__ = "Static"
__name__ = f"dynamic {name}"
__version__ = 2
`;
    const result = readPluginMetadata(source);
    expect(result.ok).toBe(true);
    if(!result.ok) return;
    expect(result.meta.id).toBe('first_id');
    expect(result.meta.name).toBe('Static');
    expect(result.meta.version).toBe('2');
    expect(result.meta.permissions_declared).toBe(false);
  });

  it('validates the id and the required name', () => {
    expect(readPluginMetadata('__name__ = "x"').ok).toBe(false);
    expect(readPluginMetadata('__id__ = "1bad" __name__ = "x"').ok).toBe(false);
    expect(readPluginMetadata('__id__ = "ok_id"').ok).toBe(false);
    expect(readPluginMetadata('__id__ = "ok_id"\n__name__ = "  "\n').ok).toBe(false);
  });

  it('an unknown permission is an error, not a silent drop', () => {
    const result = readPluginMetadata('__id__ = "perm_plugin"\n__name__ = "P"\n__permissions__ = ["ui", "roots"]');
    expect(result.ok).toBe(false);
    if(!result.ok) {
      expect(result.error).toContain('unknown permission');
    }
  });

  it('multi-line literals and comments survive', () => {
    const source = `
__id__ = 'multi'
__name__ = 'Multi'  # trailing comment
__requirements__ = [
    'cachetools>=5.3',
    'requests',
]
__beta__ = True
`;
    const result = readPluginMetadata(source);
    expect(result.ok).toBe(true);
    if(!result.ok) return;
    expect(result.meta.requirements).toEqual(['cachetools>=5.3', 'requests']);
    expect(result.meta.beta).toBe(true);
  });

  it('extractConstants keeps to top-level assignments', () => {
    const source = `
__id__ = 'top'
class C:
    __id__ = 'nested'
def f():
    __name__ = 'in function'
`;
    expect(extractConstants(source)['__id__']).toBe('top');
    expect(extractConstants(source)['__name__']).toBeUndefined();
  });
});
