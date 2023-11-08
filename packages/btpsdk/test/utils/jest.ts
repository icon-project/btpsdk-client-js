export const itIf = (condition: boolean, name: string, callback: (() => Promise<unknown>) | (() => void)) => condition ? it(name, callback) : it.skip(name, callback);
