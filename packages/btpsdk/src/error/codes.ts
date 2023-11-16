
export interface ErrorDescription<T = any> {
  code: number;
  message: string | ErrorTemplateFunc<T>;
}

export const ERR_NOT_IMPLEMENTED = {
  code: 1,
  message: 'not implemented'
};

export const ERR_UNSUPPORTED = {
  code: 2,
  message: 'unsupported method'
}

export const ERR_TIMEOUT = {
  code: 100,
  message: ({ operation }: { operation: string }) => `operation timeout - operation(${operation})`
}

export const ERR_INCONSISTENT_CHAIN = {
  code: 200,
}

export const ERR_UNKNOWN_NETWORK_TYPE = {
  code: 201,
  message: ({ type }: { type: string }) => `unknown network type - type(${type})`
}

export const ERR_UNKNOWN_NETWORK_NAME = {
  code: 202,
  message: ({ name }: { name: string }) => `unknown network name - name(${name})`
}

export const ERR_UNKNOWN_SERVICE = {
  code: 203,
  message: ({ name }: { name: string }) => `unknown service - service(${name})`
}

export const ERR_UNKNOWN_SERVICE_API = {
  code: 204,
  message: ({ service, name }: { service: string, name: string }) => `unknown service api - service(${service}), name(${name})`
}

export const ERR_INVALID_FORMAT = {
  code: 205,
  message: ({ name }: { name: string }) => `invalid ${name} format`
}

export const ERR_ILLEGAL_STATE = {
  code: 206,
  message: 'illegal state'
}

export const ERR_CLOSED_WS = {
  code: 207,
  message: ({ code, reason }: { code: number, reason: string }) => `websocket connection has closed - code(${code}) reason(${reason})`
}

export const ERR_SERVER_REJECT = {
  code: 300,
  message: 'server response code(%statusCode%), message(%message%) for operation(%operation%)'
}

export const ERR_INCONSISTENT_BLOCK = {
  code: 400,
  message: 'inconsistent block'
}

type ErrorTemplateFunc<T> = (args: T) => string;

