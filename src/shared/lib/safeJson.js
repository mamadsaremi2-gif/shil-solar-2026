const MAX_SAFE_JSON_DEPTH = 4;
const MAX_SAFE_JSON_ARRAY_ITEMS = 30;
const MAX_SAFE_JSON_STRING_LENGTH = 1200;

const BLOCKED_OBJECT_KEYS = new Set([
  'window',
  'document',
  'target',
  'currentTarget',
  'nativeEvent',
  'view',
  'srcElement',
  'ownerDocument',
  'parent',
  'top',
  'self',
  'frames',
  'opener',
]);

function isPlainObject(value) {
  if (!value || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function getObjectTag(value) {
  return Object.prototype.toString.call(value);
}

function isBrowserGlobal(value) {
  if (!value || typeof value !== 'object') return false;
  if (typeof window !== 'undefined' && value === window) return true;
  if (typeof document !== 'undefined' && value === document) return true;
  const tag = getObjectTag(value);
  return tag === '[object Window]' || tag === '[object global]' || tag === '[object HTMLDocument]';
}

function isDomNode(value) {
  return Boolean(value && typeof value === 'object' && typeof value.nodeType === 'number' && typeof value.nodeName === 'string');
}

function summarizeDomNode(value) {
  const tag = value?.tagName || value?.nodeName || 'node';
  const id = value?.id ? `#${value.id}` : '';
  const className = typeof value?.className === 'string' && value.className ? `.${value.className.split(/\s+/).slice(0, 3).join('.')}` : '';
  return `[DOM:${String(tag).toLowerCase()}${id}${className}]`;
}

export function sanitizeForJson(value, depth = 0, seen = new WeakSet()) {
  if (value == null) return value;
  const valueType = typeof value;

  if (valueType === 'string') return value.length > MAX_SAFE_JSON_STRING_LENGTH ? `${value.slice(0, MAX_SAFE_JSON_STRING_LENGTH)}...` : value;
  if (valueType === 'number') return Number.isFinite(value) ? value : null;
  if (valueType === 'boolean') return value;
  if (valueType === 'bigint') return value.toString();
  if (valueType === 'function' || valueType === 'symbol' || valueType === 'undefined') return undefined;

  if (isBrowserGlobal(value)) return '[BrowserGlobal]';
  if (isDomNode(value)) return summarizeDomNode(value);
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack?.split('\n').slice(0, 4).join('\n'),
    };
  }

  if (typeof Event !== 'undefined' && value instanceof Event) {
    return {
      type: value.type,
      timeStamp: value.timeStamp,
      target: isDomNode(value.target) ? summarizeDomNode(value.target) : undefined,
    };
  }

  if (seen.has(value)) return '[Circular]';
  if (depth >= MAX_SAFE_JSON_DEPTH) return '[MaxDepth]';
  seen.add(value);

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_SAFE_JSON_ARRAY_ITEMS)
      .map((item) => sanitizeForJson(item, depth + 1, seen))
      .filter((item) => item !== undefined);
  }

  if (!isPlainObject(value)) {
    const tag = getObjectTag(value).replace(/^\[object\s?|\]$/g, '');
    return `[${tag || 'Object'}]`;
  }

  const output = {};
  for (const [key, item] of Object.entries(value)) {
    if (BLOCKED_OBJECT_KEYS.has(key)) continue;
    const safeItem = sanitizeForJson(item, depth + 1, seen);
    if (safeItem !== undefined) output[key] = safeItem;
  }
  seen.delete(value);
  return output;
}

export function safeJsonStringify(value, fallback = '{}') {
  try {
    return JSON.stringify(sanitizeForJson(value));
  } catch (error) {
    console.warn('Safe JSON stringify fallback used', error);
    return fallback;
  }
}

export function assertJsonSafe(value) {
  try {
    JSON.stringify(value);
    return value;
  } catch {
    return sanitizeForJson(value);
  }
}
