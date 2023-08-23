export class ChainIdMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChainIdMismatchError";
  }
}

export class MissingPublicClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingPublicClientError";
  }
}

export class MissingWalletClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingWalletClientError";
  }
}

export class TransactionRevertedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransactionRevertedError";
  }
}

export class ModuleNotAvailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModuleNotAvailableError";
  }
}

export class InvalidParamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidParamError";
  }
}

export class ClientNotPreparedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClientNotPreparedError";
  }
}

export class ParametersLengthsMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParametersLengthsMismatchError";
  }
}

export class MissingTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingTokenError";
  }
}

export class ModulesRegistryFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModulesRegistryFetchError";
  }
}
