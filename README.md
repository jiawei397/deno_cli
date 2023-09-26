# 存放一些deno的小工具

- [x] task
- [x] tag
- [x] hosts
- [x] 下载资源
- [x] 脚手架，安装基于oak_nest、mongo的简单web工程

## 给deno或nodejs或Rust项目打标签

安装：

```
deno install --allow-read --allow-write --allow-run --unstable -n deno_tag -f https://deno.land/x/jw_cli@v0.9.2/cli/tag/mod.ts
```

### nodejs项目

在项目根目录下，执行

```
deno_tag
```

### deno项目

在项目根目录下执行：

```
deno_tag -V 0.0.1
deno_tag --version 0.0.1
```

或者

```
deno_tag
deno_tag patch # 与上面等价
deno_tag minor
deno_tag major
```

会更新根目录下以下文件的版本号：`deno.jsonc`或`deno.json`文件，以及`README.md`，如果后者有使用前三者之一中配置的`name`，将会对应替换。

比如本工程的名称为`jw_cli`，那么本文件中`jw_cli@v0.9.2`都会对应替换为新的版本。

#### 版本号不以v开头

假设你推送的tag版本号不想以v开头，那么可以添加一个参数-L或者--local：

```
deno_tag patch -L
```

#### 添加自定义信息

打标签时默认提交信息是版本号，如果想自定义信息，可以使用-M或者--msg：

```
deno_tag minor -M "feat: change some"
```

#### 更新所有目录的README.md文件

如果想要更新所有目录的README.md文件，可以使用-D或者--deep：

```
deno_tag -D
```

## 写入本地hosts文件

开发一个网站，本地需要频繁修改hosts

安装：

```
deno install --allow-write --allow-read -n deno_wiki -f https://deno.land/x/jw_cli@v0.9.2/cli/hosts.ts
```

使用：

```
# 本地测试
sudo deno_wiki true

# 线上测试
sudo deno_wiki false
```

## 下载资源

```bash
deno install --allow-write --allow-read --allow-net --unstable -n deno_down -f https://deno.land/x/jw_cli@v0.9.2/cli/download.ts
```

之后执行：

```bash
deno_down
```

输入下载地址和名称即可。

也可以编译为可执行文件：

```bash
deno compile --unstable --allow-write --allow-read --allow-net --target x86_64-pc-windows-msvc https://deno.land/x/jw_cli@v0.9.2/cli/download.ts
deno compile --unstable --allow-write --allow-read --allow-net https://deno.land/x/jw_cli@v0.9.2/cli/download.ts
```

## 下载deno模板工程

模板工程是依赖于`oak`与`oak_nest`，包含日志、全局异常捕获以及我们的业务`sso`校验，数据库使用`mongodb`，`CICD`配置了`.gitlab-ci.yaml`文件，可自动发布部署到我们的`gitlab`。

```bash
deno install --allow-write --allow-read --allow-net --allow-run --unstable -n deno_cli -f https://deno.land/x/jw_cli@v0.9.2/cli/project.ts
```

之后执行：

```bash
deno_cli 你的工程名称

# 或者在交互页面里输入工程名称
deno_cli
```

或者跳过全局安装，直接执行：

```bash
deno run --allow-write --allow-read --allow-net --allow-run --unstable  https://deno.land/x/jw_cli@v0.9.2/cli/project.ts 你的工程名称
```

也可以编译为可执行文件：

```bash
deno compile --unstable --allow-write --allow-read --allow-net --allow-run --target x86_64-pc-windows-msvc https://deno.land/x/jw_cli@v0.9.2/cli/project.ts
deno compile --unstable --allow-write --allow-read --allow-net --allow-run https://deno.land/x/jw_cli@v0.9.2/cli/project.ts
```

## 校验deps.ts文件是否有未带版本号

安装

```bash
deno install  --allow-read --allow-env -n deno_valid -f  https://deno.land/x/jw_cli@v0.9.2/cli/valid_deps.ts
```

## 增加git commit hook

安装

```bash
deno install  --allow-write  -n deno_hook -f  https://deno.land/x/jw_cli@v0.9.2/cli/git/git_hook.ts
```

也可以直接运行

```bash
deno run --allow-write https://deno.land/x/jw_cli@v0.9.2/cli/git/git_hook.ts
```

## 增加git push

安装

```bash
deno install  --allow-run  -n push -f  https://deno.land/x/jw_cli@v0.9.2/cli/git/push.ts
```

## 切换当前工程的Git用户

主要为解决工作中使用工作账户和GitHub上使用个人账户的问题。

```bash
deno install --allow-run --allow-net --unstable -n gum  -f https://deno.land/x/jw_cli@v0.9.2/cli/git/user_change.ts
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
