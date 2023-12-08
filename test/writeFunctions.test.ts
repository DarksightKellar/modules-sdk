import { HatsModulesClient, solidityToTypescriptType } from "../src/index";
import { HatsClient } from "@hatsprotocol/sdk-v1-core";
import { createPublicClient, createWalletClient, http } from "viem";
import { goerli } from "viem/chains";
import { createAnvil } from "@viem/anvil";
import { privateKeyToAccount } from "viem/accounts";
import * as fs from "fs";
import { ModuleFunctionRevertedError } from "../src/errors";
import type {
  PublicClient,
  WalletClient,
  PrivateKeyAccount,
  Address,
} from "viem";
import type { Anvil } from "@viem/anvil";
import type { Module, Registry } from "../src/types";
import "dotenv/config";

describe("Write Functions Client Tests", () => {
  let publicClient: PublicClient;
  let walletClient: WalletClient;
  let hatsModulesClient: HatsModulesClient;
  let hatsClient: HatsClient;
  let anvil: Anvil;

  let account1: PrivateKeyAccount;
  let account2: PrivateKeyAccount;
  let hat1: bigint;
  let hat1_1: bigint;
  let hat1_1_1: bigint;
  let hat1_2: bigint;
  let hat1_2_1: bigint;

  beforeAll(async () => {
    anvil = createAnvil({
      forkUrl: process.env.GOERLI_RPC,
      startTimeout: 20000,
    });
    await anvil.start();

    account1 = privateKeyToAccount(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    );
    account2 = privateKeyToAccount(
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
    );

    // init Viem clients
    publicClient = createPublicClient({
      chain: goerli,
      transport: http("http://127.0.0.1:8545"),
    });
    walletClient = createWalletClient({
      chain: goerli,
      transport: http("http://127.0.0.1:8545"),
    });

    const modulesFile = new URL("modules.json", import.meta.url);
    const data = fs.readFileSync(modulesFile, "utf-8");
    const registryModules: Registry = JSON.parse(data);

    hatsModulesClient = new HatsModulesClient({
      publicClient,
      walletClient,
    });

    await hatsModulesClient.prepare(registryModules);

    hatsClient = new HatsClient({
      chainId: goerli.id,
      publicClient: publicClient,
      walletClient: walletClient,
    });

    const resHat1 = await hatsClient.mintTopHat({
      target: account1.address,
      details: "Tophat SDK",
      imageURI: "Tophat URI",
      account: account1,
    });
    hat1 = resHat1.hatId;

    const resHat1_1 = await hatsClient.createHat({
      admin: hat1,
      maxSupply: 3,
      eligibility: account1.address,
      toggle: account1.address,
      mutable: true,
      details: "1.1 details",
      imageURI: "1.1 URI",
      account: account1,
    });
    hat1_1 = resHat1_1.hatId;

    const resHat1_1_1 = await hatsClient.createHat({
      admin: hat1_1,
      maxSupply: 3,
      eligibility: account1.address,
      toggle: account1.address,
      mutable: true,
      details: "1.1 details",
      imageURI: "1.1 URI",
      account: account1,
    });
    hat1_1_1 = resHat1_1_1.hatId;

    const resHat1_2 = await hatsClient.createHat({
      admin: hat1,
      maxSupply: 3,
      eligibility: account1.address,
      toggle: account1.address,
      mutable: true,
      details: "1.1 details",
      imageURI: "1.1 URI",
      account: account1,
    });
    hat1_2 = resHat1_2.hatId;

    const resHat1_2_1 = await hatsClient.createHat({
      admin: hat1_2,
      maxSupply: 3,
      eligibility: account1.address,
      toggle: account1.address,
      mutable: true,
      details: "1.1 details",
      imageURI: "1.1 URI",
      account: account1,
    });
    hat1_2_1 = resHat1_2_1.hatId;

    await hatsClient.mintHat({
      account: account1,
      hatId: hat1_1,
      wearer: account2.address,
    });
  }, 30000);

  describe("Allow List Eligibility Write Functions", () => {
    let allowListInstance: Address;

    beforeAll(async () => {
      const resAllowListInstance = await hatsModulesClient.createNewInstance({
        account: account1,
        moduleId: "0xaC208e6668DE569C6ea1db76DeCea70430335Ed5",
        hatId: hat1_1_1,
        immutableArgs: [hat1, hat1_1],
        mutableArgs: [[]],
      });
      allowListInstance = resAllowListInstance.newInstance;

      await hatsClient.changeHatEligibility({
        account: account1,
        hatId: hat1_1_1,
        newEligibility: allowListInstance,
      });
    }, 30000);

    test("Test addAccount", async () => {
      const module = hatsModulesClient.getModuleById(
        "0xaC208e6668DE569C6ea1db76DeCea70430335Ed5"
      ) as Module;

      await expect(async () => {
        await hatsModulesClient.callInstanceWriteFunction({
          account: account2,
          moduleId: "0xaC208e6668DE569C6ea1db76DeCea70430335Ed5",
          instance: allowListInstance,
          func: module?.writeFunctions[0],
          args: [account2.address],
        });
      }).rejects.toThrow(
        "Error: module function reverted with error name AllowlistEligibility_NotOwner"
      );

      const res = await hatsModulesClient.callInstanceWriteFunction({
        account: account1,
        moduleId: "0xaC208e6668DE569C6ea1db76DeCea70430335Ed5",
        instance: allowListInstance,
        func: module?.writeFunctions[0],
        args: [account2.address],
      });

      const eligibilityRes = (await publicClient.readContract({
        address: allowListInstance,
        abi: module.abi,
        functionName: "getWearerStatus",
        args: [account2.address, hat1_1_1],
      })) as boolean[];

      expect(res.status).toBe("success");
      expect(eligibilityRes[0]).toBe(true);
    }, 30000);

    test("Test removeAccount", async () => {
      const module = hatsModulesClient.getModuleById(
        "0xaC208e6668DE569C6ea1db76DeCea70430335Ed5"
      ) as Module;

      const res = await hatsModulesClient.callInstanceWriteFunction({
        account: account1,
        moduleId: "0xaC208e6668DE569C6ea1db76DeCea70430335Ed5",
        instance: allowListInstance,
        func: module?.writeFunctions[2],
        args: [account2.address],
      });

      const eligibilityRes = (await publicClient.readContract({
        address: allowListInstance,
        abi: module.abi,
        functionName: "getWearerStatus",
        args: [account2.address, hat1_1_1],
      })) as boolean[];

      expect(res.status).toBe("success");
      expect(eligibilityRes[0]).toBe(false);
    }, 30000);

    test("Test addAccounts", async () => {
      const module = hatsModulesClient.getModuleById(
        "0xaC208e6668DE569C6ea1db76DeCea70430335Ed5"
      ) as Module;

      const res = await hatsModulesClient.callInstanceWriteFunction({
        account: account1,
        moduleId: "0xaC208e6668DE569C6ea1db76DeCea70430335Ed5",
        instance: allowListInstance,
        func: module?.writeFunctions[1],
        args: [[account1.address, account2.address]],
      });

      const eligibilityRes1 = (await publicClient.readContract({
        address: allowListInstance,
        abi: module.abi,
        functionName: "getWearerStatus",
        args: [account1.address, hat1_1_1],
      })) as boolean[];
      const eligibilityRes2 = (await publicClient.readContract({
        address: allowListInstance,
        abi: module.abi,
        functionName: "getWearerStatus",
        args: [account2.address, hat1_1_1],
      })) as boolean[];

      expect(res.status).toBe("success");
      expect(eligibilityRes1[0]).toBe(true);
      expect(eligibilityRes2[0]).toBe(true);
    }, 30000);

    test("Test removeAccounts", async () => {
      const module = hatsModulesClient.getModuleById(
        "0xaC208e6668DE569C6ea1db76DeCea70430335Ed5"
      ) as Module;

      const res = await hatsModulesClient.callInstanceWriteFunction({
        account: account1,
        moduleId: "0xaC208e6668DE569C6ea1db76DeCea70430335Ed5",
        instance: allowListInstance,
        func: module?.writeFunctions[4],
        args: [[account1.address, account2.address]],
      });

      const eligibilityRes1 = (await publicClient.readContract({
        address: allowListInstance,
        abi: module.abi,
        functionName: "getWearerStatus",
        args: [account1.address, hat1_1_1],
      })) as boolean[];
      const eligibilityRes2 = (await publicClient.readContract({
        address: allowListInstance,
        abi: module.abi,
        functionName: "getWearerStatus",
        args: [account2.address, hat1_1_1],
      })) as boolean[];

      expect(res.status).toBe("success");
      expect(eligibilityRes1[0]).toBe(false);
      expect(eligibilityRes2[0]).toBe(false);
    }, 30000);
  });

  afterAll(async () => {
    await anvil.stop();
  }, 30000);
});
