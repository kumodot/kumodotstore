// Store Studio server side. Only loaded by `vite` (dev server), never part of the production build.
//
// It lets the local admin (the Studio page) do three things without any file dialog:
//   write   save a data file straight into src/data
//   asset   save an uploaded knob model or knob picture (public/models/knobs/*.glb, public/renders/*.webp|png|manifest.json)
//   status  what changed and is not published yet
//   publish check the build, commit src/data and push to main (the live site updates in about 90 seconds)
//
// Safety: only answers requests from this computer (loopback address and a localhost Host header), only writes
// existing *.ts files inside src/data (plus new files in the two asset folders above, by strict name), and every action needs a random per-run token that is handed out only to
// a same-origin request, so another website open in your browser cannot trigger anything.
import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

interface Step { name: string; ok: boolean; out: string }

function run(cmd: string, args: string[], cwd: string, timeoutMs = 180000): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd, shell: process.platform === "win32" });
    let out = "";
    const timer = setTimeout(() => { p.kill(); out += "\n[timed out]"; }, timeoutMs);
    p.stdout.on("data", (d) => { out += String(d); });
    p.stderr.on("data", (d) => { out += String(d); });
    p.on("close", (code) => { clearTimeout(timer); resolve({ code: code ?? 1, out: out.trim() }); });
  });
}

function readBody(req: IncomingMessage, limit = 2_000_000): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > limit) { reject(new Error("body too large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const send = (res: ServerResponse, code: number, body: unknown) => {
  res.statusCode = code;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
};

export function studioPlugin(): Plugin {
  let root = process.cwd();
  const token = randomBytes(16).toString("hex");

  return {
    name: "kumodot-store-studio",
    apply: "serve",
    configResolved(c) { root = c.root; },
    configureServer(server) {
      const dataDir = path.join(root, "src", "data");
      // what the Studio publishes: the data files and the knob models / pictures added from the Studio
      const PUBLISHED = ["src/data", "public/models/knobs", "public/renders"];
      const git = (args: string[]) => run("git", args, root);

      server.middlewares.use("/__studio", async (req, res) => {
        try {
          const ra = req.socket.remoteAddress ?? "";
          const host = String(req.headers.host ?? "");
          if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(ra) || !/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)) {
            return send(res, 403, { error: "local only" });
          }
          const url = String(req.url ?? "/").split("?")[0];

          if (req.method === "GET" && url === "/session") {
            const site = String(req.headers["sec-fetch-site"] ?? "same-origin");
            if (site !== "same-origin" && site !== "none") return send(res, 403, { error: "cross-site" });
            return send(res, 200, { token });
          }
          if (req.headers["x-studio-token"] !== token) return send(res, 401, { error: "bad token" });

          if (req.method === "GET" && url === "/status") {
            const branch = (await git(["rev-parse", "--abbrev-ref", "HEAD"])).out;
            const dataChanges = (await git(["status", "--porcelain", "--untracked-files=all", "--", ...PUBLISHED])).out.split("\n").filter(Boolean);
            const all = (await git(["status", "--porcelain", "--untracked-files=all"])).out.split("\n").filter(Boolean);
            const last = (await git(["log", "-1", "--format=%h%x20%s"])).out;
            return send(res, 200, {
              branch,
              changed: dataChanges.map((l) => l.slice(3)),
              otherChanges: all.length - dataChanges.length,
              last,
            });
          }

          if (req.method === "POST" && url === "/write") {
            const { file, content } = JSON.parse(await readBody(req)) as { file?: string; content?: string };
            if (typeof file !== "string" || typeof content !== "string" || !/^[A-Za-z0-9_]+\.ts$/.test(file)) {
              return send(res, 400, { error: "bad request" });
            }
            const target = path.join(dataDir, file);
            if (path.dirname(target) !== dataDir || !fs.existsSync(target)) return send(res, 400, { error: "unknown file" });
            fs.writeFileSync(target, content, "utf8");
            return send(res, 200, { ok: true, file, bytes: Buffer.byteLength(content) });
          }

          if (req.method === "POST" && url === "/asset") {
            const { file, base64 } = JSON.parse(await readBody(req, 60_000_000)) as { file?: string; base64?: string };
            if (typeof file !== "string" || typeof base64 !== "string"
              || !/^(models\/knobs\/[A-Za-z0-9_.-]+\.glb|renders\/[A-Za-z0-9_.-]+\.(webp|png)|renders\/manifest\.json)$/.test(file) || file.includes("..")) {
              return send(res, 400, { error: "bad request" });
            }
            const target = path.join(root, "public", ...file.split("/"));
            fs.mkdirSync(path.dirname(target), { recursive: true });
            const buf = Buffer.from(base64, "base64");
            fs.writeFileSync(target, buf);
            return send(res, 200, { ok: true, file, bytes: buf.length });
          }

          if (req.method === "POST" && url === "/discard") {
            const r = await git(["checkout", "--", "src/data"]);
            return send(res, r.code === 0 ? 200 : 500, { ok: r.code === 0, out: r.out });
          }

          if (req.method === "POST" && url === "/publish") {
            const steps: Step[] = [];
            const fail = (name: string, out: string) => { steps.push({ name, ok: false, out }); return send(res, 200, { ok: false, steps }); };

            const branch = (await git(["rev-parse", "--abbrev-ref", "HEAD"])).out;
            if (branch !== "main") return fail("branch", `You are on "${branch}", publishing only works from main.`);
            steps.push({ name: "branch main", ok: true, out: "" });

            const build = await run("npx", ["tsc", "-b", "--noEmit"], root);
            if (build.code !== 0) return fail("build check", build.out || "The site does not build with these changes.");
            steps.push({ name: "build check", ok: true, out: "" });

            await git(["add", "--", ...PUBLISHED]);
            const staged = await git(["diff", "--cached", "--quiet"]);
            if (staged.code === 0) return send(res, 200, { ok: true, nothing: true, steps });

            const msgFile = path.join(os.tmpdir(), `studio-msg-${Date.now()}.txt`);
            fs.writeFileSync(msgFile, "data: update from the Store Studio\n");
            const commit = await git(["commit", "-F", msgFile]);
            fs.rmSync(msgFile, { force: true });
            if (commit.code !== 0) return fail("commit", commit.out);
            steps.push({ name: "commit", ok: true, out: "" });

            const push = await git(["push", "origin", "main"]);
            if (push.code !== 0) return fail("push", push.out);
            steps.push({ name: "push", ok: true, out: "" });
            return send(res, 200, { ok: true, steps });
          }

          return send(res, 404, { error: "not found" });
        } catch (e) {
          return send(res, 500, { error: String((e as Error).message ?? e) });
        }
      });
    },
  };
}
