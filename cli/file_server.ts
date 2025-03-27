import { Hono } from "jsr:@hono/hono@^4";
import { extname, join } from "jsr:@std/path@^0.218.0";
import { parseArgs } from "jsr:@std/cli@1/parse-args";
import { contentType } from "jsr:@std/media-types@^1";

const app = new Hono();

// 解析命令行参数
const flags = parseArgs(Deno.args, {
  string: ["origin", "port"],
  boolean: ["help", "debug", "binary"],
  default: {
    origin: "*",
    port: "8000",
    debug: false,
    binary: false,
  },
  alias: {
    h: "help",
    p: "port",
    o: "origin",
    d: "debug",
    b: "binary",
  },
});

if (flags.help) {
  console.log(`
File Server Usage: 
  deno run -A main.ts <folder_path> [options]

Options:
  --help, -h         Show help information
  --port=<port>, -p  Specify listening port (default: 8000)
  --origin=<origin>, -o  Set CORS allowed origin (default: *)
  --debug, -d        Enable debug mode, display detailed request information
  --binary, -b       Set unknown file types to download as binary instead of displaying as text (default: false)

Examples:
  deno run -A main.ts ./public --port=8080 --origin=http://localhost:3000 --debug
  deno run -A main.ts ./public --binary
`);
  Deno.exit(0);
}

const folderPath = flags._[0];
const port = flags.port;
const origin = flags.origin;
const debug = flags.debug;
const binaryMode = flags.binary;

if (!folderPath) {
  console.error("Error: Please specify a folder path to serve");
  console.error("Use --help to see usage instructions");
  Deno.exit(1);
}

const rootPath = Deno.realPathSync(folderPath as string);

// 根据文件扩展名获取 MIME 类型
function getMimeType(path: string): string {
  const ext = extname(path).toLowerCase();
  
  // 针对TypeScript文件的特殊处理
  if (ext === ".ts") {
    return "text/javascript; charset=UTF-8";
  }
  
  // 使用标准库获取MIME类型
  const type = contentType(ext);
  
  // 根据二进制模式决定默认MIME类型
  if (!type) {
    if (binaryMode) {
      return "application/octet-stream"; // 强制下载
    } else {
      return "text/plain; charset=UTF-8"; // 作为文本显示
    }
  }
  
  return type;
}

// 添加CORS中间件
app.use("/*", async (c, next) => {
  c.res.headers.set("Access-Control-Allow-Origin", origin);
  c.res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  c.res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  await next();
});

// 生成文件列表HTML
function generateDirectoryListing(
  path: string,
  files: Deno.DirEntry[],
): string {
  const relativePath = path === "/" ? "" : path;

  const items = files.map((file) => {
    const itemPath = join(relativePath, file.name);
    const itemName = file.isDirectory ? `${file.name}/` : file.name;
    
    // 添加文件大小和修改时间
    let fileInfo = "";
    if (!file.isDirectory) {
      try {
        const stat = Deno.statSync(join(rootPath, itemPath));
        const size = stat.size > 1024 * 1024
          ? (stat.size / (1024 * 1024)).toFixed(2) + " MB"
          : stat.size > 1024
          ? (stat.size / 1024).toFixed(2) + " KB"
          : stat.size + " B";
          
        const modified = stat.mtime ? 
          new Date(stat.mtime).toLocaleString() : "Unknown";
        
        fileInfo = `<span class="size">${size}</span><span class="date">${modified}</span>`;
      } catch {
        fileInfo = "";
      }
    }
    
    return `<li class="${file.isDirectory ? 'directory' : 'file'}">
      <a href="${itemPath}">
        <span class="name">${itemName}</span>
        ${fileInfo}
      </a>
    </li>`;
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Directory Listing - ${path}</title>
        <style>
          :root {
            --bg-color: #ffffff;
            --text-color: #333333;
            --accent-color: #0366d6;
            --hover-bg: #f6f8fa;
            --border-color: #eee;
          }
          
          @media (prefers-color-scheme: dark) {
            :root {
              --bg-color: #0d1117;
              --text-color: #c9d1d9;
              --accent-color: #58a6ff;
              --hover-bg: #161b22;
              --border-color: #30363d;
            }
          }
          
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background-color: var(--bg-color);
            color: var(--text-color);
          }
          
          h1 {
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          
          ul {
            list-style-type: none;
            padding: 0;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            overflow: hidden;
          }
          
          li {
            border-bottom: 1px solid var(--border-color);
          }
          
          li:last-child {
            border-bottom: none;
          }
          
          li a {
            display: flex;
            text-decoration: none;
            color: var(--accent-color);
            padding: 12px 15px;
            align-items: center;
          }
          
          li a:hover {
            background-color: var(--hover-bg);
          }
          
          .name {
            flex: 1;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .directory .name {
            font-weight: 600;
          }
          
          .size {
            width: 80px;
            text-align: right;
            color: #666;
            font-size: 0.9em;
            margin-right: 20px;
          }
          
          .date {
            width: 180px;
            text-align: right;
            color: #999;
            font-size: 0.9em;
          }
          
          @media (max-width: 768px) {
            .date {
              display: none;
            }
          }
          
          @media (max-width: 480px) {
            h1 {
              font-size: 1.5em;
            }
            .size, .date {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <h1>Directory: ${path}</h1>
        <ul>
          ${
    path !== "/" ? `<li class="directory"><a href="${join(relativePath, "..")}"><span class="name">..</span></a></li>` : ""
  }
          ${items.join("\n")}
        </ul>
        <footer style="margin-top: 20px; font-size: 0.8em; color: #999; text-align: center;">
          Deno File Server
        </footer>
      </body>
    </html>
  `;
}

// 自定义静态文件服务中间件
app.use("/*", async (c) => {
  try {
    const path = c.req.path;
    const filePath = join(rootPath, decodeURIComponent(path));
    console.log(`Actual file path: ${filePath}`);

    // 检查路径是否是目录
    const stat = await Deno.stat(filePath);

    if (stat.isDirectory) {
      // 如果是目录但URL不以斜杠结尾，进行重定向
      if (!path.endsWith("/")) {
        return new Response(null, {
          status: 301,
          headers: {
            "Location": `${path}/`,
          },
        });
      }

      // 检查是否存在 index.html
      const indexPath = join(filePath, "index.html");
      try {
        const indexFile = await Deno.readFile(indexPath);
        return new Response(indexFile, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        });
      } catch {
        // index.html 不存在，生成目录列表
        const dirEntries = [];
        for await (const entry of Deno.readDir(filePath)) {
          dirEntries.push(entry);
        }

        // 按照文件夹在前，文件在后的顺序排序
        dirEntries.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });

        const html = generateDirectoryListing(path, dirEntries);
        return new Response(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        });
      }
    } else {
      // 处理常规文件
      const file = await Deno.readFile(filePath);
      if (debug) {
        console.log(`File size: ${file.length} bytes`);
        console.log(`Content-Type: ${getMimeType(filePath)}`);
      }

      return new Response(file, {
        headers: {
          "Content-Type": getMimeType(filePath),
        },
      });
    }
  } catch (error) {
    if (debug) {
      console.error("Error handling request:", error);
    }

    if (error instanceof Deno.errors.NotFound) {
      return c.notFound();
    }
    return c.text("Internal Server Error", 500);
  }
});

// 启动服务
console.log(`Starting file server...
Folder path: ${folderPath}
Access URL: http://localhost:${port}
CORS allowed origin: ${origin}
Debug mode: ${debug ? "enabled" : "disabled"}
Binary mode: ${binaryMode ? "enabled" : "disabled"}`);

Deno.serve({ port: Number(port) }, app.fetch);
