import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
// 1 つの HTML にまとめて出す（JS・CSS を埋め込む）。別ファイルを読みに行かない
// ので、dist/index.html をダブルクリックで開いても動き、GitHub Pages
// （https://onishigyo.github.io/who-is-bacnet/）でもパスを気にせず配れる。
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
