
export interface Signer {
  init(): Promise<void>;
  supports(): Array<string>;
  address(type: string): Promise<string>;
  sign(type: string, message: string): Promise<string>;
}
