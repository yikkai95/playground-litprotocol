import Lit from "./lit.ts";

const chain = "ethereum";
const lit = new Lit(chain);

//lit.balance().then(console.log);

// encrypt
await lit.connect();
const resp = await lit.encrypt('some password')
console.log(resp)
await lit.disconnect()

// decrypt
//const resp = {
//  ciphertext: "kNsMoztKJGRfgTBAowCl7JjYaNjAa3M/FVKM4UDOHt1ZzSK1qMgE/t5vz9Zhhkdo2C4I1ec/3Nsm+91JvAPk1p037edFP79oxiNg4gRI0uT3jcAOWe6akJtGREl/rKjEmbybC52eu07zIWhmUC",
//  dataToEncryptHash: "e62e1269317b9654e1314dfecb78f29b35ad4d362da0a9c2ccdb680aa535d"
//}
//await lit.decrypt(resp.ciphertext, resp.dataToEncryptHash).then(console.log)
//await lit.disconnect()

