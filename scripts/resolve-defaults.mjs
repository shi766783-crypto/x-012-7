// 仅供 Node 直跑测试使用：让无扩展名的相对 ESM 导入（项目走 Vite 解析）回退到 .js
export async function resolve(specifier, context, nextResolve) {
  if (
    (specifier.startsWith('./') || specifier.startsWith('../')) &&
    !/\.[a-zA-Z0-9]+$/.test(specifier)
  ) {
    try {
      return await nextResolve(`${specifier}.js`, context)
    } catch {
      // 继续走默认解析
    }
  }
  return nextResolve(specifier, context)
}
