import { spawn } from "child_process";
import http from "http";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9228;

async function run() {
  const chrome = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${PORT}`,
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--user-data-dir=/tmp/chrome-debug-ovf-" + Date.now(),
    ],
    { stdio: "ignore" }
  );

  let targets = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      targets = await new Promise((res, rej) => {
        const req = http.get(`http://127.0.0.1:${PORT}/json/list`, (r) => {
          let d = "";
          r.on("data", (c) => (d += c));
          r.on("end", () => {
            try {
              res(JSON.parse(d));
            } catch (e) {
              rej(e);
            }
          });
        });
        req.on("error", rej);
      });
      if (targets && targets.length > 0) break;
    } catch {}
  }

  const page = targets.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let id = 1;
  const send = (m, p) =>
    new Promise((res) => {
      const cur = id++;
      const handler = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === cur) {
          ws.removeEventListener("message", handler);
          res(msg.result);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id: cur, method: m, params: p }));
    });

  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 320,
    height: 568,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await send("Page.navigate", { url: "http://127.0.0.1:4321/merge-pdf" });
  await new Promise((r) => setTimeout(r, 600));

  const result = await send("Runtime.evaluate", {
    expression: `
      (() => {
        const logoDiv = document.querySelector("#site-header > div > div:first-child");
        return JSON.stringify({
          logoDivW: logoDiv.offsetWidth,
          children: Array.from(logoDiv.children).map(c => ({
            tag: c.tagName,
            cls: c.className,
            w: c.offsetWidth,
            html: c.outerHTML
          }))
        });
      })()
    `,
  });

  console.log(result.result.value);
  ws.close();
  chrome.kill();
}

run().catch(console.error);
