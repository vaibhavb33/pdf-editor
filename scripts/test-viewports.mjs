import { spawn } from "child_process";
import http from "http";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9222;
const BASE_URL = "http://127.0.0.1:4321";

const VIEWPORTS = [
  { name: "Mobile Small (320px)", width: 320, height: 568 },
  { name: "Mobile Medium (375px)", width: 375, height: 667 },
  { name: "Tablet (768px)", width: 768, height: 1024 },
  { name: "Desktop (1280px)", width: 1280, height: 800 },
];

const PAGES_TO_TEST = [
  "/",
  "/merge-pdf",
  "/split-pdf",
  "/compress-pdf",
  "/rotate-pdf",
  "/delete-pages",
  "/organize-pdf",
  "/pdf-to-jpg",
  "/jpg-to-pdf",
  "/watermark-pdf",
  "/page-numbers-pdf",
  "/sign-pdf",
  "/protect-pdf",
  "/unlock-pdf",
  "/edit-pdf",
];

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
      res.on("error", reject);
    });
    req.on("error", reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) {
          reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        } else {
          resolve(msg.result);
        }
      }
    };
  }

  send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function run() {
  console.log("================================================================");
  console.log("   PDFIVO RESPONSIVE VIEWPORT EMPIRICAL TEST SUITE   ");
  console.log("================================================================");

  console.log(`Starting headless Chrome on debugging port ${PORT}...`);
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${PORT}`,
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--hide-scrollbars",
      "--user-data-dir=/tmp/chrome-test-profile-" + Date.now(),
    ],
    { stdio: "ignore" }
  );

  let connected = false;
  let targetWsUrl = null;

  for (let i = 0; i < 30; i++) {
    await sleep(300);
    try {
      const targets = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
      const pageTarget = targets.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (pageTarget) {
        targetWsUrl = pageTarget.webSocketDebuggerUrl;
        connected = true;
        break;
      }
    } catch {
      // Chrome starting up
    }
  }

  if (!connected) {
    chromeProcess.kill();
    throw new Error("Could not connect to Chrome debugging port.");
  }

  const client = new CDPClient(targetWsUrl);
  await client.connect();
  await client.send("Page.enable");
  await client.send("DOM.enable");

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  try {
    for (const pagePath of PAGES_TO_TEST) {
      console.log(`\nTesting route: ${pagePath}`);
      for (const vp of VIEWPORTS) {
        totalTests++;
        process.stdout.write(`  [${vp.width}x${vp.height}] ${vp.name.padEnd(25)}: `);

        // Set viewport metrics
        await client.send("Emulation.setDeviceMetricsOverride", {
          width: vp.width,
          height: vp.height,
          deviceScaleFactor: 1,
          mobile: false,
        });

        // Navigate
        await client.send("Page.navigate", { url: `${BASE_URL}${pagePath}` });
        await sleep(350); // wait for layout to settle

        // Evaluate layout metrics
        const evalRes = await client.send("Runtime.evaluate", {
          expression: `
            (() => {
              const docWidth = document.documentElement.scrollWidth;
              const winWidth = window.innerWidth;
              const hasHorizontalScroll = docWidth > winWidth + 1; // 1px subpixel margin

              // Find touch targets (buttons and links)
              const interactiveEls = Array.from(document.querySelectorAll("button, a.btn, input[type='button'], input[type='submit']"));
              const tooSmallTargets = [];
              for (const el of interactiveEls) {
                const rect = el.getBoundingClientRect();
                // only test visible buttons in current viewport
                if (rect.width > 0 && rect.height > 0 && rect.top < 1200) {
                  if (rect.width < 40 || rect.height < 40) {
                    // Check if it's an icon button or inline tag
                    if (!el.closest("nav") && !el.classList.contains("sr-only")) {
                      tooSmallTargets.push({ tag: el.tagName, text: el.textContent?.slice(0, 20), w: Math.round(rect.width), h: Math.round(rect.height) });
                    }
                  }
                }
              }

              // Check if dropzone exists on tool pages
              const hasDropzone = document.querySelector("[role='button']") !== null || document.querySelector("input[type='file']") !== null;

              return {
                docWidth,
                winWidth,
                hasHorizontalScroll,
                tooSmallTargetsCount: tooSmallTargets.length,
                hasDropzone
              };
            })()
          `,
          returnByValue: true,
        });

        const val = evalRes.result?.value;
        if (!val) {
          console.log("FAIL (Evaluation error)");
          failedTests++;
          continue;
        }

        if (val.hasHorizontalScroll) {
          console.log(
            `FAIL (Horizontal overflow: docWidth ${val.docWidth}px > winWidth ${val.winWidth}px)`
          );
          failedTests++;
        } else {
          console.log(`PASS (docWidth: ${val.docWidth}px <= ${val.winWidth}px, 0 overflow)`);
          passedTests++;
        }
      }
    }
  } finally {
    await client.close();
    chromeProcess.kill();
  }

  console.log("\n================================================================");
  console.log(`VIEWPORT TEST SUMMARY:`);
  console.log(`  Passed: ${passedTests}`);
  console.log(`  Failed: ${failedTests}`);
  console.log(`  Total:  ${totalTests}`);
  console.log("================================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
