# 存放一些Deno的小工具

- [x] 给Deno或Node.js或Rust项目打标签
- [x] 下载资源
- [x] 脚手架，安装基于oak_nest、mongo的简单web工程
- [x] 切换当前工程的Git用户

## 给Deno或Node.js或Rust项目打标签，并推送到远程

安装：

```bash
deno install --allow-read --allow-write --allow-run --unstable --import-map https://deno.land/x/jw_cli@v1.0.1/import_map.json -n tag -f https://deno.land/x/jw_cli@v1.0.1/cli/tag/mod.ts
```

### Node.js项目

在项目根目录下，执行

```bash
tag
```

### Deno项目

在项目根目录下执行：

```bash
tag -V 0.0.1
tag --version 0.0.1
```

或者

```bash
tag
tag patch # 与上面等价
tag minor
tag major
```

会更新根目录下以下文件的版本号：`deno.jsonc`或`deno.json`文件，以及`README.md`，如果后者有使用前三者之一中配置的`name`，将会对应替换。

比如本工程的名称为`jw_cli`，那么本文件中`jw_cli@v1.0.1`都会对应替换为新的版本。

#### 版本号不以v开头

假设你推送的tag版本号不想以v开头，那么可以添加一个参数-L或者--local：

```bash
tag patch -L
```

#### 添加自定义信息

打标签时默认提交信息是版本号，如果想自定义信息，可以使用-M或者--msg：

```bash
tag minor -M "feat: change some"
```

#### 更新所有目录的README.md文件

如果想要更新所有目录的README.md文件，可以使用-D或者--deep：

```bash
tag -D
```

## 下载资源

```bash
deno install --allow-write --allow-read --allow-net --unstable --import-map https://deno.land/x/jw_cli@v1.0.1/import_map.json -n deno_down -f https://deno.land/x/jw_cli@v1.0.1/cli/download.ts
```

之后执行：

```bash
deno_down
```

输入下载地址和名称即可。

也可以编译为可执行文件：

```bash
deno compile --unstable --allow-write --allow-read --allow-net --import-map https://deno.land/x/jw_cli@v1.0.1/import_map.json --target x86_64-pc-windows-msvc https://deno.land/x/jw_cli@v1.0.1/cli/download.ts
deno compile --unstable --allow-write --allow-read --allow-net --import-map https://deno.land/x/jw_cli@v1.0.1/import_map.json https://deno.land/x/jw_cli@v1.0.1/cli/download.ts
```

## 下载deno模板工程

模板工程是依赖于`oak`与`oak_nest`，包含日志、全局异常捕获以及我们的业务`sso`校验，数据库使用`mongodb`，`CICD`配置了`.gitlab-ci.yaml`文件，可自动发布部署到我们的`gitlab`。

```bash
deno install --allow-write --allow-read --allow-net --allow-run --unstable --import-map https://deno.land/x/jw_cli@v1.0.1/import_map.json -n deno_cli -f https://deno.land/x/jw_cli@v1.0.1/cli/project.ts
```

之后执行：

```bash
deno_cli 你的工程名称

# 或者在交互页面里输入工程名称
deno_cli
```

或者跳过全局安装，直接执行：

```bash
deno run --allow-write --allow-read --allow-net --allow-run --unstable --import-map https://deno.land/x/jw_cli@v1.0.1/import_map.json  https://deno.land/x/jw_cli@v1.0.1/cli/project.ts 你的工程名称
```

## 增加Git Commit hook

安装

```bash
deno install  --allow-write --import-map https://deno.land/x/jw_cli@v1.0.1/import_map.json  -n deno_hook -f  https://deno.land/x/jw_cli@v1.0.1/cli/git/git_hook.ts
```

之后运行：

```bash
deno_hook
```

也可以直接运行：

```bash
deno run --allow-write --import-map https://deno.land/x/jw_cli@v1.0.1/import_map.json https://deno.land/x/jw_cli@v1.0.1/cli/git/git_hook.ts
```

## 增加git push

安装

```bash
deno install  --allow-run --import-map https://deno.land/x/jw_cli@v1.0.1/import_map.json  -n push -f  https://deno.land/x/jw_cli@v1.0.1/cli/git/push.ts
```

## 切换当前工程的Git用户

主要为解决工作中使用工作账户和GitHub上使用个人账户的问题。

```bash
deno install --allow-run --allow-net --allow-read --allow-write --allow-env --unstable --import-map https://deno.land/x/jw_cli@v1.0.1/import_map.json -n gum  -f https://deno.land/x/jw_cli@v1.0.1/cli/git/user_change.ts
```

展示列表：

```bash
$ gum 
# 等同于
$ gum list

┌───────┬──────────┬─────────────────┬─────────┐
│ Alias │ UserName │ Email           │ Current │
├───────┼──────────┼─────────────────┼─────────┤
│ xx    │ xxxxx    │ xxxxx@126.com   │ ✓       │
├───────┼──────────┼─────────────────┼─────────┤
│ xxxx  │ xxxx     │ xxxxxx@xxxx.com │         │
└───────┴──────────┴─────────────────┴─────────┘
```

增加：

```bash
$ gum add 

? Set a username › test
? Set a email › test
? Set an alias (test) › test
Git user added
```

使用：

```bash
$ gum use test
```

删除：

```bash
$ gum del test
```
