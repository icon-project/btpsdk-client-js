import type {
  Network,
} from "../provider/types";

export interface ServiceDescription {
  name: string;
  networks: Array<Network>;
  methods: Array<MethodDescription>;
}

export interface MethodDescription {
  name: string;
  networks: Array<string>;
  // TODO add properties for validating value
  inputs: Array<string>;
  readonly: boolean;
}
