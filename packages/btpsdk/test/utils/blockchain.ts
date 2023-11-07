import assert from "assert";

export interface Block {
  id: string;
  height: number;
  parent?: string;
}

export interface EventLog {
  name: string; // event log name
  params: Map<string, any>;
}

export type Listener = (...args: any[]) => void;
export type EventName = 'created';
export type ForkFunc = (canonical: Block) => Block | null;

type Timer = ReturnType<typeof setInterval>;

const genid = (): string => {
  return [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

const generator = (function* () {
  let parent: undefined | Block;
  while (true) {
    const block = {
      id: genid(),
      height: parent != null ? parent.height + 1 : 0,
        parent: parent != null ? parent.id : undefined,
    };
    yield block;
    parent = block;
  }
})();

const genblock = () => {
  return generator.next().value;
};

const GENESIS = genblock();

export class BlockChain {
  #period: number = 1000;
  #timer: Timer | null = null;
  #subs: Map<EventName, Array<Listener>> = new Map();
  #created: Block = GENESIS;
  #finalized: Block = GENESIS;
  #fork: ForkFunc;

  #parent?: Block;
  #ancestor?: Block;

  constructor(opts: {
    fork?: ForkFunc,
    period?: number,
  } = {}) {
    this.#fork = opts.fork ?? (() => null);
    this.#period = opts.period ?? 1000;
  }

  get genesis(): Block {
    return GENESIS;
  }

  created(): Block {
    return this.#created;
  }

  finalized(): Block {
    return this.#finalized;
  }

  tick() {
    this.#created = genblock();
    if (this.#created.height > 2) {
      this.#finalized = this.#ancestor!!;
    }

    setTimeout(this.emit.bind(this, 'created', this.#fork(this.#created) ?? this.#created), 0);
    this.#ancestor = this.#parent;
    this.#parent = this.#created;
  }

  put(log: EventLog) {
    
  }

  start() {
    this.#timer = setInterval(this.tick.bind(this), this.#period);
  }

  stop() {
    if (this.#timer != null) {
      clearInterval(this.#timer);
    }
  }

  on(type: EventName, listener: Listener): void {
    var listeners = this.#subs.get(type);
    if (listeners != null) {
      listeners.push(listener);
    } else {
      this.#subs.set(type, [ listener ]);
    }
  }

  emit(type: EventName, ...args: any[]): void {
    const listeners = this.#subs.get(type);
    assert(listeners != null);
    for (const listener of listeners) {
      listener(...args);
    }
  }
}
