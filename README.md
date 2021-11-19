# 存放一些deno的小工具

- [x] task
- [x] tag
- [x] hosts

## 给deno或nodejs项目打标签

安装：

```
deno install --allow-read --allow-write --allow-run -n deno_tag -f https://deno.land/x/jw_cli@v0.2.0/cli/tag.ts
```

使用：

1. nodejs项目，在项目根目录下，执行

```
deno_tag
```

2. deno项目，在项目根目录下执行：

```
deno_tag 0.0.1
```

或者

```
deno_tag patch
deno_tag minor
deno_tag major
```

会更新根目录下的`scripts.yml`文件和`README.md`，如果后者有使用`scripts.yml`中配置的`name`，将会对应替换。

比如本工程的名称为`jw_cli`，那么本文件中`jw_cli@v0.2.0`都会对应替换为新的版本。

## 写入本地hosts文件

开发一个网站，本地需要频繁修改hosts

安装：

```
deno install --allow-write --allow-read -n deno_wiki -f https://deno.land/x/jw_cli@v0.2.0/cli/hosts.ts
```

使用：

```
# 本地测试
sudo deno_wiki true

# 线上测试
sudo deno_wiki false
```

## 下载资源

```
deno install --allow-write --allow-read -n deno_down -f https://deno.land/x/jw_cli@v0.2.0/cli/download.ts
```

之后执行：

```
deno_down
```

输入下载地址和名称即可。

也可以编译为可执行文件：

```
deno compile --unstable --allow-write --allow-read --allow-net --target x86_64-pc-windows-msvc https://deno.land/x/jw_cli@v0.2.0/cli/download.ts
deno compile --unstable --allow-write --allow-read --allow-net https://deno.land/x/jw_cli@v0.2.0/cli/download.ts
```

## 下载deno模板工程

模板工程是依赖于`oak`与`oak_nest`，包含日志、全局异常捕获以及我们的业务`sso`校验，数据库使用`mongodb`，工程运行推荐使用`denon`，`CICD`配置了`.gitlab-ci.yaml`文件，可自动发布部署到我们的`gitlab`。

```
deno install --allow-write --allow-read -n deno_cli -f https://deno.land/x/jw_cli@v0.2.0/cli/project.ts
```

之后执行：

```
deno_cli
```

输入你的工程名称即可。

也可以编译为可执行文件：

```
deno compile --unstable --allow-write --allow-read --allow-net --target x86_64-pc-windows-msvc https://deno.land/x/jw_cli@v0.2.0/cli/project.ts
deno compile --unstable --allow-write --allow-read --allow-net https://deno.land/x/jw_cli@v0.2.0/cli/project.ts
```
