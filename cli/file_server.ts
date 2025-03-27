import { Hono } from "jsr:@hono/hono@^4";
import { extname, join } from "jsr:@std/path@^0.218.0";
import { parseArgs } from "jsr:@std/cli@1/parse-args";
import { contentType } from "jsr:@std/media-types@^1";
import { extract, install } from "https://esm.sh/@twind/core@1.1.3";
import presetTailwind from "https://esm.sh/@twind/preset-tailwind@1.1.4";

// 安装 Twind
install({
  presets: [presetTailwind()],
  darkMode: 'media', // 启用基于媒体查询的深色模式
});

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
        
        fileInfo = `
          <span class="hidden sm:block w-20 text-right text-gray-500 dark:text-gray-400 text-sm mr-4">${size}</span>
          <span class="hidden md:block w-44 text-right text-gray-400 dark:text-gray-500 text-sm">${modified}</span>
        `;
      } catch {
        fileInfo = "";
      }
    }
    
    // 为文件类型选择图标
    const fileIcon = file.isDirectory ? 
      '<svg class="w-5 h-5 text-yellow-500 dark:text-yellow-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path></svg>' : 
      '<svg class="w-5 h-5 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path></svg>';
    
    return `<li class="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <a href="${itemPath}" class="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition duration-150">
        ${fileIcon}
        <span class="flex-1 truncate font-medium ${file.isDirectory ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''}">${itemName}</span>
        ${fileInfo}
      </a>
    </li>`;
  });
  
  // 构建 HTML 模板
  const body = `
    <!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>目录列表 - ${path}</title>
      </head>
      <body class="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <div class="max-w-5xl mx-auto px-4 py-8">
          <div class="flex items-center justify-between mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
            <h1 class="text-2xl font-bold">目录列表: ${path}</h1>
          </div>
          
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <ul>
              ${
                path !== "/" ? 
                `<li class="border-b border-gray-200 dark:border-gray-700">
                  <a href="${join(relativePath, "..")}" class="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition duration-150">
                    <svg class="w-5 h-5 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="flex-1 font-medium">..</span>
                  </a>
                </li>` : ""
              }
              ${items.join("\n")}
            </ul>
          </div>
          
          <footer class="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 py-4">
            Deno File Server
          </footer>
        </div>
      </body>
    </html>
  `;
  
  // 使用 Twind 提取生成的 CSS
  const { html, css } = extract(body);
  
  // 将提取的 CSS 注入到 HTML 的头部
  return html.replace("</head>", `<style data-twind>${css}</style></head>`);
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
