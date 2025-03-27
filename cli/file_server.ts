import { Hono } from "jsr:@hono/hono@^4";
import { extname, join } from "jsr:@std/path@^0.218.0";
import { parseArgs } from "jsr:@std/cli@1/parse-args";
import { contentType } from "jsr:@std/media-types@^1";

const app = new Hono();

// 解析命令行参数
const flags = parseArgs(Deno.args, {
  string: ["origin", "port"],
  boolean: ["help", "debug"],
  default: {
    origin: "*",
    port: "8000",
    debug: false,
  },
  alias: {
    h: "help",
    p: "port",
    o: "origin",
    d: "debug",
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

Examples:
  deno run -A main.ts ./public --port=8080 --origin=http://localhost:3000 --debug
`);
  Deno.exit(0);
}

const folderPath = flags._[0];
const port = flags.port;
const origin = flags.origin;
const debug = flags.debug;

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
  return type || "application/octet-stream";
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
    return `<li><a href="${itemPath}">${itemName}</a></li>`;
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Directory Listing - ${path}</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { border-bottom: 1px solid #eee; padding-bottom: 10px; }
          ul { list-style-type: none; padding: 0; }
          li { margin: 8px 0; }
          a { display: block; padding: 8px; text-decoration: none; color: #0366d6; }
          a:hover { background-color: #f6f8fa; }
        </style>
      </head>
      <body>
        <h1>Directory: ${path}</h1>
        <ul>
          ${
    path !== "/" ? `<li><a href="${join(relativePath, "..")}">..</a></li>` : ""
  }
          ${items.join("\n")}
        </ul>
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
Debug mode: ${debug ? "enabled" : "disabled"}`);

Deno.serve({ port: Number(port) }, app.fetch);
