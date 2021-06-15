存放一些deno的小工具

- [x] task
- [x] tag
- [ ] others

## 给deno或nodejs项目打标签

安装：
```
deno install --allow-net --allow-read --allow-run -n deno_tag -f https://deno.land/x/jw_cli@v0.0.2/cli/tag.ts
```

使用：
nodejs项目，在项目根目录下，执行
```
deno_tag
```

deno项目，在项目根目录下执行：
```
deno_tag 0.0.1
```

