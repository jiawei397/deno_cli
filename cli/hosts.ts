// deno install --allow-write --allow-read -n deno_wiki -f ./cli/hosts.ts
// sudo deno_wiki true
// sudo deno_wiki false
let isLocal = false; // 可以访问外网wiki.com。如果是true，意味着要本地进行测试。也就是说，默认是开启外网的。
if (Deno.args?.[0] === "true") {
  isLocal = true;
}
const hosts = `##
# Host Database
#
# localhost is used to configure the loopback interface
# when the system is booting.  Do not change this entry.
##
127.0.0.1       localhost
255.255.255.255 broadcasthost
::1             localhost
# Added by Docker Desktop
# To allow the same kube context to work on the host and the container:
127.0.0.1 kubernetes.docker.internal
# End of section

${isLocal ? "" : "# "}127.0.0.1 wiki.uino.com

# 172.217.4.110 google.com
185.199.108.133 185.199.109.133 185.199.110.133 185.199.111.133 raw.githubusercontent.com
# 209.197.3.24  code.jquery.com
# 140.82.112.4  github.com
# 140.82.112.3  github.com
# 52.217.128.137 github-cloud.s3.amazonaws.com

# 199.232.69.194 github.global.ssl.fastly.net
76.76.21.21 denopkg.com`;

const encoder = new TextEncoder();
const data = encoder.encode(hosts);
Deno.writeFileSync("/etc/hosts", data); // overwrite "hello1.txt" or create it
console.log(`写入成功，${isLocal ? "本地可以测试wiki.com" : "可以访问外网wiki.com"}`);
