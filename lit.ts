import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { ethers } from "ethers";
import { LIT_RPC, LitNetwork } from "@lit-protocol/constants";
import { AccessControlConditions } from "@lit-protocol/types";
import {
  createSiweMessageWithRecaps,
  generateAuthSig,
  LitAbility,
  LitAccessControlConditionResource,
} from "@lit-protocol/auth-helpers";

const litNetwork = LitNetwork.DatilTest;

const accessControlConditions: AccessControlConditions = [
  {
    contractAddress: "ipfs://QmcEWjAbfUQHCQTfpA3uNDGfCyL2QMVtCgh7vtCXZKRC7n",
    standardContractType: "LitAction",
    chain: "ethereum",
    method: "go",
    parameters: ["40"],
    returnValueTest: {
      comparator: "=",
      value: "true",
    },
  },
];
//const accessControlConditions: AccessControlConditions = [
//  {
//    contractAddress: '',
//    standardContractType: '',
//    chain: "ethereum",
//    method: 'eth_getBalance',
//    parameters: [
//      ':userAddress',
//      'latest'
//    ],
//    returnValueTest: {
//      comparator: '>=',
//      value: '10000000000000'
//    }
//  }
//]

class Lit {
  litNodeClient: LitJsSdk.LitNodeClientNodeJs;
  chain: string;
  wallet: ethers.Wallet;

  constructor(chain: string) {
    this.chain = chain;

    const privateKey = Deno.env.get("WALLET")!;
    this.wallet = new ethers.Wallet(privateKey);
  }

  balance() {
    const provider = new ethers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE);
    return provider.getBalance(this.wallet.address);
  }

  async connect() {
    const litNodeClient = new LitJsSdk.LitNodeClientNodeJs({
      alertWhenUnauthorized: false,
      litNetwork,
      debug: false,
    });

    this.litNodeClient = litNodeClient;
    await this.litNodeClient.connect();
  }

  async disconnect() {
    await this.litNodeClient.disconnect();
  }

  async getAuthSig() {
    // put your private key into this env var
    const latestBlockhash = await this.litNodeClient.getLatestBlockhash();

    const litResource = new LitAccessControlConditionResource("*");
    const toSign = await createSiweMessageWithRecaps({
      uri: `http://localhost:3000`,
      expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
      resources: [
        {
          resource: litResource,
          ability: LitAbility.AccessControlConditionDecryption,
        },
      ],
      walletAddress: this.wallet.address,
      nonce: latestBlockhash,
      litNodeClient: this.litNodeClient,
    });

    // Generate the authSig
    const authSig = await generateAuthSig({
      signer: this.wallet,
      toSign,
    });

    return authSig;
  }

  async encrypt(message: string) {
    // Encrypt the message
    const { ciphertext, dataToEncryptHash } = await LitJsSdk.encryptString(
      {
        accessControlConditions,
        dataToEncrypt: message,
      },
      this.litNodeClient,
    );

    // Return the ciphertext and dataToEncryptHash
    return {
      ciphertext,
      dataToEncryptHash,
    };
  }

  //async getSessionSignatures() {
  //  // Get the latest blockhash
  //  const latestBlockhash = await this.litNodeClient.getLatestBlockhash();

  //  // Define the authNeededCallback function
  //  const authNeededCallback = async (params) => {
  //    if (!params.uri) {
  //      throw new Error("uri is required");
  //    }
  //    if (!params.expiration) {
  //      throw new Error("expiration is required");
  //    }

  //    if (!params.resourceAbilityRequests) {
  //      throw new Error("resourceAbilityRequests is required");
  //    }

  //    console.log("hello", params.uri);
  //    // Create the SIWE message
  //    const toSign = await createSiweMessageWithRecaps({
  //      uri: params.uri,
  //      expiration: params.expiration,
  //      resources: params.resourceAbilityRequests,
  //      walletAddress: this.wallet.address,
  //      nonce: latestBlockhash,
  //      litNodeClient: this.litNodeClient,
  //    });

  //    // Generate the authSig
  //    const authSig = await generateAuthSig({
  //      signer: this.wallet,
  //      toSign,
  //    });

  //    return authSig;
  //  };

  //  // Define the Lit resource
  //  const litResource = new LitAccessControlConditionResource("*");

  //  // Get the session signatures
  //  const sessionSigs = await this.litNodeClient.getSessionSigs({
  //    chain: this.chain,
  //    resourceAbilityRequests: [
  //      {
  //        resource: litResource,
  //        ability: LitAbility.AccessControlConditionDecryption,
  //      },
  //    ],
  //    authNeededCallback,
  //    //capacityDelegationAuthSig,
  //  });
  //  return sessionSigs;
  //}

  async decrypt(ciphertext: string, dataToEncryptHash: string) {

    // Decrypt the message
    const decryptedString = await LitJsSdk.decryptToString(
      {
        accessControlConditions,
        chain: this.chain,
        ciphertext,
        dataToEncryptHash,
        authSig: await this.getAuthSig(),
      },
      this.litNodeClient,
    );

    // Return the decrypted string
    return { decryptedString };
  }
}

export default Lit;
