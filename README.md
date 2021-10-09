存放一些deno的小工具

- [x] task
- [x] tag
- [x] hosts

## 给deno或nodejs项目打标签

安装：

```
deno install --allow-net --allow-read --allow-run -n deno_tag -f https://deno.land/x/jw_cli@v0.0.2/cli/tag.ts
```

使用： nodejs项目，在项目根目录下，执行

```
deno_tag
```

deno项目，在项目根目录下执行：

```
deno_tag 0.0.1
```

## 写入本地hosts文件

开发一个网站，本地需要频繁修改hosts

安装：

```
deno install --allow-write --allow-read -n deno_wiki -f https://deno.land/x/jw_cli@v0.0.3/cli/hosts.ts
```

使用：

```
# 本地测试
sudo deno_wiki true

# 线上测试
sudo deno_wiki false
```
