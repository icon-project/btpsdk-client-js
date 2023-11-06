
export interface ErrorDescription {
  code: number;
  message: string | ErrorTemplateFunc;
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

export const ERR_SERVER_REJECT = {
  code: 300,
  message: 'server response code(%statusCode%), message(%message%) for operation(%operation%)'
}

export const ERR_INCONSISTENT_BLOCK = {
  code: 400,
  message: 'inconsistent block'
}

type ErrorTemplateFunc = (args: any) => string;

