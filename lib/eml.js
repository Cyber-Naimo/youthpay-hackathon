// Dependency-free .eml (RFC822 / MIME) parser.
// Handles multipart bodies, base64 / quoted-printable transfer encodings,
// header folding, and HTML-to-text. Picks the richest text part available.

function splitHeadersBody(raw) {
  const idx = raw.search(/\r?\n\r?\n/);
  if (idx === -1) return { head: raw, body: "" };
  const sep = raw.slice(idx).match(/^\r?\n\r?\n/)[0];
  return { head: raw.slice(0, idx), body: raw.slice(idx + sep.length) };
}

// Parse a header block into a lowercase-keyed map, unfolding continuation lines.
function parseHeaders(head) {
  const map = {};
  const lines = head.split(/\r?\n/);
  let current = null;
  for (const line of lines) {
    if (/^[ \t]/.test(line) && current) {
      map[current] += " " + line.trim();
    } else {
      const m = line.match(/^([^:]+):\s?(.*)$/);
      if (m) {
        current = m[1].toLowerCase();
        map[current] = m[2];
      }
    }
  }
  return map;
}

function getBoundary(contentType) {
  const m = contentType && contentType.match(/boundary="?([^";]+)"?/i);
  return m ? m[1] : null;
}

function decodeBody(body, encoding, charset) {
  const enc = (encoding || "").toLowerCase();
  try {
    if (enc === "base64") {
      const clean = body.replace(/\s+/g, "");
      return Buffer.from(clean, "base64").toString(charset || "utf8");
    }
    if (enc === "quoted-printable") {
      return body
        .replace(/=\r?\n/g, "")
        .replace(/=([0-9A-Fa-f]{2})/g, (_, h) =>
          String.fromCharCode(parseInt(h, 16))
        );
    }
  } catch {
    /* fall through */
  }
  return body;
}

function htmlToText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<(br|\/p|\/div|\/tr|\/td)[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function parseEml(raw) {
  const { head, body } = splitHeadersBody(raw);
  const headers = parseHeaders(head);
  const rootCt = headers["content-type"] || "text/plain";

  const subject = decodeMimeWord(headers["subject"] || "");
  const sender = headers["from"] || "";

  let textOut = "";

  const boundary = getBoundary(rootCt);
  if (/multipart\//i.test(rootCt) && boundary) {
    // Collect leaf parts, decode each, prefer text/plain then text/html.
    const leaves = collectLeaves(body, boundary);
    const plain = leaves.find((l) => /text\/plain/i.test(l.ct));
    const html = leaves.find((l) => /text\/html/i.test(l.ct));
    if (plain) {
      textOut = decodeBody(plain.body, plain.enc, plain.charset);
    } else if (html) {
      textOut = htmlToText(decodeBody(html.body, html.enc, html.charset));
    }
  } else if (/text\/html/i.test(rootCt)) {
    textOut = htmlToText(
      decodeBody(body, headers["content-transfer-encoding"], charsetOf(rootCt))
    );
  } else {
    textOut = decodeBody(body, headers["content-transfer-encoding"], charsetOf(rootCt));
    if (/<html|<body|<div|<table/i.test(textOut)) textOut = htmlToText(textOut);
  }

  return {
    subject,
    sender,
    body: textOut.replace(/\s+/g, " ").trim(),
    received_at: parseHeaderDate(headers["date"]),
  };
}

// Recursively gather all leaf (non-multipart) parts with their decode info.
function collectLeaves(body, boundary, acc = []) {
  const parts = body.split("--" + boundary);
  for (const part of parts) {
    const trimmed = part.replace(/^\r?\n/, "");
    if (!trimmed || trimmed === "--" || trimmed.startsWith("--\r")) continue;
    const { head, body: pbody } = splitHeadersBody(trimmed);
    const h = parseHeaders(head);
    const ct = h["content-type"] || "";
    const nested = getBoundary(ct);
    if (/multipart\//i.test(ct) && nested) {
      collectLeaves(pbody, nested, acc);
    } else if (ct) {
      acc.push({
        ct,
        body: pbody,
        enc: h["content-transfer-encoding"],
        charset: charsetOf(ct),
      });
    }
  }
  return acc;
}

function charsetOf(ct) {
  const m = ct && ct.match(/charset="?([^";]+)"?/i);
  return m ? m[1].toLowerCase() : "utf8";
}

// Decode minimal RFC2047 encoded-word subjects (=?utf-8?B?...?=).
function decodeMimeWord(str) {
  return str.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_, cs, enc, data) => {
    try {
      if (/b/i.test(enc)) return Buffer.from(data, "base64").toString("utf8");
      return data
        .replace(/_/g, " ")
        .replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    } catch {
      return data;
    }
  });
}

function parseHeaderDate(d) {
  if (!d) return new Date().toISOString();
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}
