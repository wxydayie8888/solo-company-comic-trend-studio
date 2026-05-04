import { createHash, createHmac } from "node:crypto";

// Volcengine OpenAPI V4 signing.
// Reference: https://www.volcengine.com/docs/6369/67269
// Compatible with AWS SigV4 conventions but uses "Volc" prefix for the secret derivation.

export interface SignArgs {
  method: "GET" | "POST";
  host: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: string;
  service: string;
  region: string;
  ak: string;
  sk: string;
  now?: Date;
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

function sha256Hex(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function uriEncode(value: string, encodeSlash = true): string {
  return value
    .split("")
    .map((ch) => {
      if (/[A-Za-z0-9\-_.~]/.test(ch)) return ch;
      if (ch === "/" && !encodeSlash) return ch;
      return encodeURIComponent(ch).replace(/!/g, "%21").replace(/\*/g, "%2A");
    })
    .join("");
}

function canonicalQuery(query: Record<string, string>): string {
  const keys = Object.keys(query).sort();
  return keys.map((k) => `${uriEncode(k)}=${uriEncode(String(query[k]))}`).join("&");
}

export interface SignedRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
}

export function signVolcengine(args: SignArgs): SignedRequest {
  const now = args.now ?? new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").replace("Z", "Z");
  const date = amzDate.slice(0, 8);

  const headers: Record<string, string> = {
    ...args.headers,
    Host: args.host,
    "X-Date": amzDate,
    "X-Content-Sha256": sha256Hex(args.body || "")
  };

  const sortedHeaderKeys = Object.keys(headers)
    .map((k) => k.toLowerCase())
    .sort();
  const canonicalHeaders = sortedHeaderKeys
    .map((k) => {
      const original = Object.keys(headers).find((h) => h.toLowerCase() === k) ?? k;
      return `${k}:${String(headers[original]).trim()}`;
    })
    .join("\n");
  const signedHeaders = sortedHeaderKeys.join(";");

  const canonicalRequest = [
    args.method,
    uriEncode(args.path, false) || "/",
    canonicalQuery(args.query),
    `${canonicalHeaders}\n`,
    signedHeaders,
    sha256Hex(args.body || "")
  ].join("\n");

  const credentialScope = `${date}/${args.region}/${args.service}/request`;
  const stringToSign = ["HMAC-SHA256", amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");

  const kDate = hmac(args.sk, date);
  const kRegion = hmac(kDate, args.region);
  const kService = hmac(kRegion, args.service);
  const kSigning = hmac(kService, "request");
  const signature = createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");

  const authorization = `HMAC-SHA256 Credential=${args.ak}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  headers.Authorization = authorization;

  const queryString = canonicalQuery(args.query);
  const url = `https://${args.host}${args.path}${queryString ? `?${queryString}` : ""}`;
  return { url, headers, body: args.body };
}
