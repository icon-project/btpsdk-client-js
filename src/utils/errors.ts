const inspect = Symbol.for('nodejs.util.inspect.custom');

export function assert(condition: any, msg?: string): asserts condition {
  if (!condition) {
    throw new Error('AssertionError');
  }
}

export class BTPError extends Error {
  readonly parent?: Error;
  readonly description: ErrorDescription;
  #stack: string;
  _isBTPError: boolean;
  constructor(description: ErrorDescription, args: Record<string, any> = {}, parent?: Error) {
    super(template(description.message, args));

    if ((Error as any).captureStackTrace !== undefined) {
      (Error as any).captureStackTrace(this, this.constructor);
    }

    this.#stack = this.stack ?? "";
    this.description = description;
    this._isBTPError = true;
    Object.defineProperty(this, "stack", {
      get: () => this[inspect](),
    });
  }

  public [inspect](): string {
    let str = this.#stack;
    if (this.parent !== undefined) {
      const parentAsAny = this.parent as any;
      const causeString =
        parentAsAny[inspect]?.() ??
        parentAsAny.inspect?.() ??
        parentAsAny.stack ??
        parentAsAny.toString();
      const nestedCauseStr = causeString
        .split("\n")
        .map((line: string) => `    ${line}`)
        .join("\n")
        .trim();
      str += `

    Caused by: ${nestedCauseStr}`;
    }
    return str;
  }

  static is (other: any): other is BTPError;
  static is (other: any, desc: ErrorDescription): other is BTPError
  static is (other: any, desc?: ErrorDescription): other is BTPError {
    if (desc == null) {
      return other instanceof BTPError
    } else {
      return other instanceof BTPError && other.description.code === desc.code;
    }
  }
}

export interface ErrorDescription {
  code: number;
  title: string;
  message: string;
}

function stringify(value: any): string {
  if (typeof(value) === 'number' || typeof(value) === 'string') {
    return value.toString();
  } else if (value === undefined) {
    return 'undefined';
  } else if (value === null) {
    return 'null';
  } else if (Array.isArray(value)) {
    var conv = value.map(v => {
      return stringify(v)
    });
    return `[${conv.join(', ')}]`;
  } else {
    throw new Error('not supported value type');
  }
}

function template(message: string, args: { [ name: string ]: any }): string {
  var copy = message;
  for (const [ name, value ] of Object.entries(args)) {
    while (copy.includes(`%${name}%`)) {
      copy = copy.replace(`%${name}%`, stringify(value));
    }
  }
  return copy;
}

export const ERRORS = {
  GENERAL: {
    NOT_IMPLEMENTED: {
      code: 0,
      title: "TODO",
      message: "TODO"
    },
    INVALID_ARGUMENT: {
      code: 1,
      title: "the argument is invalid",
      message: "invalid argument: `%field%` `%value%`"
    },
    UNSUPPORTED_OP: {
      code: 2,
      title: "unsupported operation",
      message: "`%operation% isn't supported"
    },
    ILLEGAL_STATE: {
      code: 3,
      title: "",
      message: ""
    },
    UNKNOWN: {
      code: 4,
      title: "",
      message: ""
    }
  },
  NETWORK: {
    NOT_FOUND: {
      code: 400,
      title: "the passed network does not exist",
      message: "unknown network: `%network%`, available networks: `$networks$`"
    },
    INCONSISTENT_BLOCK: {
      code: 401,
      title: "inconsistent block",
      message: "the inconsistent block can be forked"
    }
  },
  SERVER: {
    UNKNOWN_SERVER_ERROR: {
      code: 500,
      title: '',
      message: '',
    }
  }
}
